
async function checkIndex() {
  const res = await fetch("https://mc-rb4zzrxvx1.bunny.run/");
  const text = await res.text();
  console.log(text.substring(0, 1000));
}
checkIndex();
