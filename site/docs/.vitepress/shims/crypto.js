// Minimal browser shim for Node's `crypto` — enough for cursor fingerprints.
// paginate() (search/sort/filter/pagination) never calls this.

function fnv1aHex(input) {
  // 128-bit-ish hex by hashing the string four times with different seeds.
  const seeds = [0x811c9dc5, 0x01000193, 0x9e3779b9, 0x85ebca6b];
  return seeds
    .map((seed) => {
      let h = seed >>> 0;
      for (let i = 0; i < input.length; i++) {
        h ^= input.codePointAt(i);
        h = Math.imul(h, 0x01000193) >>> 0;
      }
      return ("00000000" + h.toString(16)).slice(-8);
    })
    .join("");
}

function createHash() {
  let buffer = "";
  return {
    update(value) {
      buffer += String(value);
      return this;
    },
    digest() {
      return fnv1aHex(buffer);
    },
  };
}

const cryptoShim = { createHash };

export { createHash };
export default cryptoShim;
