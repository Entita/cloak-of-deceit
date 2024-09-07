import React from 'react'
import { ContinueButtonStyled, ImbeddedButtonStyled, LoginWrapperStyled } from './Login.style'
import { setAccountToLocal } from '@/utils/account'
import axios from 'axios'

export default function Login({ account, setAccount }: { account: any, setAccount: Function }) {
  const [routeHTML, setRouteHTML] = React.useState<string>('')
  const [foundEmail, setFoundEmail] = React.useState<Boolean>(false)
  const [username, setUsername] = React.useState<string>('')
  const [clickedContinue, setClickedContinue] = React.useState<Boolean>(false)
  const emailRef = React.useRef<HTMLInputElement | null>(null)

  const isEmailUsed = () => {
    const email = emailRef.current?.value
    if (!email) return
    axios.get(`/api/account?email=${email}`)
      .then(({ data }) => {
        if (data.success) {
          setClickedContinue(true)
          setFoundEmail(data.found)
          if (!data.found) setUsername(data.username)
        }
      })
  }

  const onChangeEmailUsed = () => {
    if (clickedContinue) isEmailUsed()
  }

  React.useEffect(() => {
    axios.get('/api/auth/signin')
      .then(({ data }) => setRouteHTML(data))
  }, [])

  return (
    <LoginWrapperStyled>
        <h1>Cloak of Deceit</h1>
        {routeHTML ? (
          <ImbeddedButtonStyled dangerouslySetInnerHTML={{ __html: routeHTML }} />
        ) : (
          <span>loading</span>
        )}
        <input ref={emailRef} onChange={onChangeEmailUsed} placeholder='Email' />
        {!clickedContinue ? <ContinueButtonStyled onClick={isEmailUsed}>Continue</ContinueButtonStyled>
        : foundEmail ? <LoginForm emailElement={emailRef.current} setAccount={setAccount} />
        : <RegisterForm emailElement={emailRef.current} username={username} setAccount={setAccount} />}
    </LoginWrapperStyled>
  )
}

const LoginForm = ({ emailElement, setAccount }: { emailElement: HTMLInputElement | null, setAccount: Function }) => {
  const [showPassword, setShowPassword] = React.useState<Boolean>(false)
  const passwordRef = React.useRef<HTMLInputElement | null>(null)

  const togglePassword = () => {
    setShowPassword(prev => !prev)
  }

  const login = () => {
    const password = passwordRef.current?.value
    const email = emailElement?.value
    if (!email || !password) return

    axios.post('/api/account', { email, password })
      .then(({ data }) => {
        if (data.success) {
          setAccountToLocal(data.account)
          setAccount(data.account)
        }
      })
  }

  return (
    <>
      <input ref={passwordRef} placeholder='Password' type={showPassword ? 'password' : 'text'} />
      <button onClick={togglePassword}>show password</button>
      <ContinueButtonStyled onClick={login}>Log In</ContinueButtonStyled>
    </>
  )
}

const RegisterForm = ({ username, emailElement, setAccount }: { username: string, emailElement: HTMLInputElement | null, setAccount: Function }) => {
  const passwordRef = React.useRef<HTMLInputElement | null>(null)
  const passwordRepeatRef = React.useRef<HTMLInputElement | null>(null)
  const usernameRef = React.useRef<HTMLInputElement | null>(null)

  const register = () => {
    const password = passwordRef.current?.value
    const repeatPassword = passwordRepeatRef.current?.value
    const username = usernameRef.current?.value
    const email = emailElement?.value
    if (!email || !password || password !== repeatPassword || !username) return

    axios.put('/api/account', { email, password, username })
      .then(({ data }) => {
        if (data.success) setAccount(data.account)
      })
  }

  return (
    <>
      <input ref={passwordRef} placeholder='Password' />
      <input ref={passwordRepeatRef} placeholder='Repeat password' />
      <input ref={usernameRef} placeholder='Player name' defaultValue={username} />
      <ContinueButtonStyled onClick={register}>Create account</ContinueButtonStyled>
    </>
  )
}
