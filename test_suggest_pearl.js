async function test() {
  const q = 'pearl dental nyc';
  const url = `http://localhost:3000/api/search-suggest?q=${encodeURIComponent(q)}`;
  console.log("Fetching suggestions from:", url);
  try {
    const res = await fetch(url);
    if (res.ok) {
      const data = await res.json();
      console.log(JSON.stringify(data, null, 2));
    } else {
      console.log("Error:", res.status);
    }
  } catch (e) {
    console.error(e);
  }
}

test();
