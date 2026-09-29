import bcrypt from "bcryptjs";

const password = "erika123";
const hash = await bcrypt.hash(password, 10);
console.log(hash);
