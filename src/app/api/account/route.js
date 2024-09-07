import { NextResponse } from 'next/server'
import Account from '@/models/Account'
import { dbConnect, findMongo } from '@/utils/dbMongo'
import { generateUsername } from '../auth/[...nextauth]/route'
import md5 from 'md5'

dbConnect()

export const addAccount = async (data) => {
  return await Account(data).save()
}

export const getAccountFromDb = async (filter) => {
  return await findMongo(Account, filter)
}

const createAccount = async(data) => {
  const account = await getAccountFromDb({ email: data.email, provider: 'web' })
  if (account) return null
  return await addAccount(data)
}

const loginToAccount = async(email, password) => {
  const account = await getAccountFromDb({ email, password, provider: 'web' })
  return account
}

export async function GET(req) {
  try {
    const email = req.nextUrl.searchParams.get('email')
    const account = await getAccountFromDb({ email, provider: 'web' })
    const username = !account ? generateUsername() : null

    return NextResponse.json({ success: true, found: !!account, username })
  } catch (err) {
    console.log(err)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

export async function POST(req) {
  try {
    const { email, password, local = false } = await req.json()
    const account = await loginToAccount(email, local ? password : md5(password))
    return NextResponse.json({ success: !!account, account })
  } catch (err) {
    console.log(err)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

export async function PUT(req) {
  try {
    const { email, password, username } = await req.json()

    const account = await createAccount({ email, password: md5(password), username, provider: 'web' })
    return NextResponse.json({ success: !!account, account })
  } catch (err) {
    console.log(err)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}