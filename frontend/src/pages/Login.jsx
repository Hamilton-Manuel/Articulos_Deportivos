import LoginForm from "../components/loginform"
import ThemeToggle from "../components/themetoggle"
import './Login.css';

export default function Login() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background transition-colors duration-300">
      <ThemeToggle />
      <LoginForm />
    </div>
  )
}
