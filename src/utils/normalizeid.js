function normalizeId(id) {
  try {
    const normalizedId = id.replace(/[^a-fA-F0-9]/g, "");

    if (normalizedId.length !== 24) {
      throw new Error("O ID informado é invalido");
    }

    return normalizedId;
  } catch (err) {
    console.log(err);
    return null;
  }
}

module.exports = {
  normalizeId,
};
