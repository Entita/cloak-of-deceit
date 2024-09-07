import NextAuth from "next-auth"
import GoogleProvider from "next-auth/providers/google"
import { addAccount, getAccountFromDb } from "../../account/route"
import { uniqueNamesGenerator, adjectives, animals, names, starWars } from 'unique-names-generator';

export const generateUsername = () => {
  return uniqueNamesGenerator({ dictionaries: [adjectives, animals, names, starWars], separator: ' ', length: 2, style: 'capital' })
}

const handler = NextAuth({
  secret: process.env.AUTH_SECRET,
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
  ],
  callbacks: {
    async signIn({ user: { email } }) {
      const getAccountsByEmail = await getAccountFromDb({ email, provider: 'google' })
      if (getAccountsByEmail.length === 0) {
        const username = generateUsername()
        await addAccount({ email, username, provider: 'google' })
      }
      return true
    },
    async jwt({ token }) {
      const { email } = token
      const account = await getAccountFromDb({ email, provider: 'google' })
      token.account = account
      return token
    },
    async session({ token }) {
      return token.account
    },
  }
})

export { handler as GET, handler as POST }
