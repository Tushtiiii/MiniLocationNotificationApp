const users = [
  { name: "Amit", email: "amit@gmail.com" },
  { name: "Riya", email: "riya@gmail.com" },
  { name: "Amit Kumar", email: "amit@gmail.com" }
];


const seen = new Set();

const uniqueUsers = users.filter(user => {
  if (seen.has(user.email)) {
    return false;
  }

  seen.add(user.email);
  return true;
});

console.log(uniqueUsers);
