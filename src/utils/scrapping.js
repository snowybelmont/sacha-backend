const { Cluster } = require("puppeteer-cluster");
const bcrypt = require("bcrypt");

async function Scrap({ email, password, type }) {
  const urlBase = "https://www.fateconline.com.br/sistema";
  let data = null;
  let cluster = null;
  const PROD = true;
  const saltRounds = 10;

  try {
    cluster = await Cluster.launch({
      concurrency: Cluster.CONCURRENCY_CONTEXT,
      maxConcurrency: 10,
      monitor: true,
      puppeteerOptions: {
        headless: PROD,
        args: PROD
          ? [
              "--disable-setuid-sandbox",
              "--no-sandbox",
              "--single-process",
              "--no-zygote",
              "--disable-features=site-per-process",
              "--disable-dev-shm-usage",
              "--disable-gpu",
            ]
          : [],
        executablePath: PROD
          ? process.env.PUPPETEER_EXECUTABLE_PATH
          : undefined,
      },
      retryLimit: 1,
    });

    await cluster.task(async ({ page }) => {
      try {
        await page.goto(urlBase, {
          waitUntil: "load",
          timeout: 0,
        });

        await page.waitForSelector("#txtEmail");
        await page.waitForSelector("#txtSenha");
        await page.waitForSelector("#btnLogar");

        await page.type("#txtEmail", email);
        await page.type("#txtSenha", password);

        await Promise.all([page.waitForNavigation(), page.click("#btnLogar")]);

        const alert = await page.$(".alert");

        if (alert) {
          throw new Error("Login Incorreto");
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

        const photo = await page.$eval(
          'img[id="ImgMiniatura"]',
          (img) => img.src
        );

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

        const hashedPassword = await bcrypt.hash(password, saltRounds);

        data = {
          RA: RA.substr(5, 8).trim(),
          name: name,
          email: email,
          password: hashedPassword,
          type: type,
          photo: photo,
          curse: RA.substr(22, 4).trim(),
          periode: RA.substr(34, 6).trim(),
          class: discipline,
        };
      } catch (err) {
        console.log(err);
        throw new Error("Erro durante o processo no cluster");
      } finally {
        await page.close();
      }
    });

    const jobs = [];
    for (let i = 0; i < 10; i++) {
      jobs.push({
        email: email,
        password: password,
        type: type,
      });
    }

    await cluster.execute(jobs);
    await cluster.idle();
  } catch (err) {
    console.error(err);
  } finally {
    if (cluster) {
      await cluster.close();
    }
  }

  return data;
}

module.exports = {
  Scrap,
};
