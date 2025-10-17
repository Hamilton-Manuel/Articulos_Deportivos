import { useState } from "react"
import { Mail, Lock } from "lucide-react"


export default function LoginForm() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")

  const handleSubmit = (e) => {
    e.preventDefault()
    console.log("Usuario:", email, "Contraseña:", password)
  }

  return (
    <div className="w-full max-w-md p-8 bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl shadow-2xl text-white">
      <h2 className="text-3xl font-bold mb-6 text-center uppercase tracking-wide">
        Bienvenido
      </h2>
      <p className="text-center text-gray-300 mb-8">
        Inicia sesión en tu cuenta
      </p>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Campo correo */}
        <div>
          <label className="block text-sm mb-2 text-gray-300">
            Correo electrónico
          </label>
          <div className="flex items-center bg-white/10 rounded-lg px-3 py-2">
            <Mail className="w-5 h-5 text-gray-400 mr-2" />
            <input
              type="email"
              placeholder="Tu correo"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-transparent outline-none text-white placeholder-gray-400"
              required
            />
          </div>
        </div>

        {/* Campo contraseña */}
        <div>
          <label className="block text-sm mb-2 text-gray-300">
            Contraseña
          </label>
          <div className="flex items-center bg-white/10 rounded-lg px-3 py-2">
            <Lock className="w-5 h-5 text-gray-400 mr-2" />
            <input
              type="password"
              placeholder="********"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-transparent outline-none text-white placeholder-gray-400"
              required
            />
          </div>
        </div>

        {/* Botón de iniciar sesión */}
        <button
          type="submit"
          className="w-full py-3 mt-4 bg-black text-white font-semibold rounded-lg border border-white hover:bg-white hover:text-black transition-all duration-300"
        >
          Iniciar sesión
        </button>

        {/* Separador */}
        <div className="flex items-center justify-center mt-6">
          <div className="border-t border-gray-600 w-1/3"></div>
          <span className="mx-2 text-gray-400 text-sm">o continúa con</span>
          <div className="border-t border-gray-600 w-1/3"></div>
        </div>

        {/* Botones sociales */}
        <div className="flex justify-center gap-4 mt-4">
          <button className="px-4 py-2 bg-white text-black rounded-md font-semibold flex items-center gap-2 hover:bg-gray-200 transition">
             Apple
          </button>
          <button className="px-4 py-2 bg-white text-black rounded-md font-semibold flex items-center gap-2 hover:bg-gray-200 transition">
            🔍 Google
          </button>
        </div>

        {/* Registro */}
        <p className="text-center text-sm text-gray-400 mt-6">
          ¿No tienes cuenta?{" "}
          <a href="#" className="text-white hover:underline">
            Regístrate aquí
          </a>
        </p>
      </form>
    </div>
  )
}
