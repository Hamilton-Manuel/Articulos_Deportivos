// models/contenido.model.js

// Exportamos una función que define el modelo 'contenido' (serie/película)
module.exports = (sequelize, Sequelize) => {
  // Definimos el modelo con los campos del enunciado
  const Contenido = sequelize.define("contenido", {
    // Nombre de la serie/película
    nombre: {
      type: Sequelize.STRING
    },
    // Sinopsis
    sinopsis: {
      type: Sequelize.TEXT
    },
    // Actores (puedes guardar una lista separada por comas)
    actores: {
      type: Sequelize.TEXT
    },
    // Duración en minutos
    duracion: {
      type: Sequelize.INTEGER
    },
    // Tipo: Serie/Película
    tipo: {
      type: Sequelize.STRING // "Serie" o "Pelicula"
    },
    // Categoría (género)
    categoria: {
      type: Sequelize.STRING
    },
    // Año de lanzamiento
    anio_lanzamiento: {
      type: Sequelize.INTEGER
    },
    // Puntuación (por ejemplo, de 0 a 10)
    puntuacion: {
      type: Sequelize.FLOAT
    }
  });

  // Retornamos el modelo para usarlo en otras partes del proyecto
  return Contenido;
};
