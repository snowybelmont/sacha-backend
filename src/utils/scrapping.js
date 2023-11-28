require("dotenv").config();
const pup = require("puppeteer");
const PROD = false;

const urlBase = "https://www.fateconline.com.br/sistema";
let initalError;
let userData = null;
let browser;
let state;

async function initializePuppeteer() {
  try {
    if (PROD === true) {
      browser = await pup.launch({
        headless: true,
        args: [
          "--disable-setuid-sandbox",
          "--no-sandbox",
          "--single-process",
          "--no-zygote",
          "--disable-features=site-per-process",
        ],
        executablePath: process.env.PUPPETEER_EXECUTABLE_PATH,
      });
    } else {
      browser = await pup.launch({ headless: false });
    }

    return browser;
  } catch (err) {
    console.log(err);
    return (initalError = "Não foi possível iniciar o Puppeteer");
  }
}

async function Login(page, email, password) {
  try {
    await page.waitForSelector("#txtEmail");
    await page.waitForSelector("#txtSenha");
    await page.waitForSelector("#btnLogar");

    await page.type("#txtEmail", email);
    await page.type("#txtSenha", password);

    await Promise.all([page.waitForNavigation(), page.click("#btnLogar")]);

    const alert = await page.$(".alert");

    if (alert !== "" && alert !== null) {
      throw new Error("Login Incorreto");
    }

    return "Sucesso";
  } catch (err) {
    console.log(err);
    if (!initalError) {
      return (initalError = "Não foi possível fazer o login");
    } else {
      return null;
    }
  }
}

async function ExtractData(page, email, password, type) {
  try {
    await page.waitForSelector(".dropdown-toggle");
    await page.click(".dropdown-toggle");
    await page.waitForSelector("#Li9");

    await Promise.all([page.waitForNavigation(), page.click("#Li9")]);

    if (page.url() !== `${urlBase}/Paginas/Alunos/Faltas.aspx`) {
      throw new Error("O redirecionamento falhou");
    }

    await page.waitForSelector("#body_ddlEstrutura");
    await page.waitForSelector(".sorting_1");
    await page.waitForSelector("#ImgMiniatura");

    let RA = await page.$$eval("#body_ddlEstrutura > option", (nRA) =>
      nRA.map((option) => option.text)
    );
    RA = RA[1];
    const selector = "td.sorting_1";
    const discipline = await page.evaluate((selector) => {
      const tds = document.querySelectorAll(selector);

      return Array.from(tds, (td) => td.textContent.trim());
    }, selector);

    const photo = await page.$eval('img[id="ImgMiniatura"]', (img) => img.src);

    await page.waitForSelector(".navbar-custom-menu");
    await page.click(".navbar-custom-menu");
    await page.waitForSelector(".btn");

    await Promise.all([page.waitForNavigation(), page.click(".btn")]);

    if (page.url() !== `${urlBase}/Paginas/Alunos/Cadastro.aspx`) {
      throw new Error("O redirecionamento falhou");
    }

    await page.waitForSelector("#txbNome");

    const name = await page.$eval(
      'input[name="ctl00$body$txbNome"]',
      (input) => input.value
    );

    const data = {
      RA: RA.substr(5, 8).trim(),
      name: name,
      email: email,
      password: password,
      type: type,
      photo: photo,
      curse: RA.substr(22, 4).trim(),
      periode: RA.substr(34, 6).trim(),
      class: discipline,
    };

    return data;
  } catch (err) {
    console.log(err);
    if (!initalError) {
      return (initalError = "Não foi possível extrair os dados");
    } else {
      return null;
    }
  }
}

async function Scrap({ email, password, type }) {
  try {
    const browser = await initializePuppeteer();

    if (
      browser === null ||
      initalError === "Não foi possível iniciar o Puppeteer"
    ) {
      throw new Error("Não foi possível iniciar o Puppeteer");
    }

    const page = await browser.newPage();

    if (!page) {
      throw new Error("Página não inciou");
    }

    await page.goto(urlBase, {
      waitUntil: "load",
      timeout: 0,
    });

    state = await Login(page, email, password);

    if (state === null || initalError === "Não foi possível fazer o login") {
      throw new Error("Não foi possível fazer o login");
    }

    if (type === "aluno") {
      if (page.url() === `${urlBase}/Paginas/Professores/`) {
        throw new Error("Não é aluno");
      }
    } else if (type === "professor") {
      if (page.url() === `${urlBase}/Paginas/Alunos/}`) {
        throw new Error("Não é professor");
      }
    }

    userData = await ExtractData(page, email, password, type);

    if (
      userData === null ||
      initalError === "Não foi possível extrair os dados"
    ) {
      throw new Error("Sem nenhum dado");
    }

    await browser.close();
    return userData;
  } catch (err) {
    console.log(err);
    if (!initalError) {
      return (initalError = "Não foi possível extrair os dados");
    } else {
      return null;
    }
  }
}

module.exports = {
  Scrap,
};
