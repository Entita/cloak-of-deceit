import axios from "axios"

export const getAccountFromLocal = async () => {
  const local = typeof window !== "undefined" ? JSON.parse(localStorage.getItem('account') || '{}') : {}
  if (Object.keys(local).length === 0) return null

  const expirationDate = new Date(local.expire).setDate(new Date(local.expire).getDate() + 1)
  if (new Date().getTime() > expirationDate) return null

  const account = await axios.post('/api/account', { email: local.email, password: local.password, local: true })
    .then(({ data }) => data.success && data.account)
    .catch((error) => console.error(error))
  return account
}

export const setAccountToLocal = (account) => {
  localStorage.setItem('account', JSON.stringify({ email: account.email, password: account.password, expire: new Date() }))
}

export const removeAccountFromLocal = () => {
  localStorage.removeItem('account')
}