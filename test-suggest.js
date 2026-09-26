const query = "דואר ישראל";
fetch(`http://localhost:3000/api/search-suggest?q=${encodeURIComponent(query)}`)
  .then(res => {
    console.log("Status:", res.status);
    return res.json();
  })
  .then(data => {
    console.log("Data:", JSON.stringify(data, null, 2));
  })
  .catch(err => {
    console.error("Error calling search-suggest:", err);
  });
