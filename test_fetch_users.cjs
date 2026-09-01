fetch("http://localhost:3000/api/nosql/users/usr_does_not_exist")
  .then(r => console.log(r.status))
  .catch(e => console.error(e));
