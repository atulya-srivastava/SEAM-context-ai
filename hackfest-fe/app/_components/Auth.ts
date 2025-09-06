import { auth } from "@clerk/nextjs/server"
export const UserDetails = async () => {
  const user = await auth();
  return user;
}