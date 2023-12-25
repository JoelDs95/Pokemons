const { Router } = require('express');
const { getPokemons, getPokemonById, getPokemonByName, createPokemon, getTypes } = require('../controllers');

// Importar todos los routers;
// Ejemplo: const authRouter = require('./auth.js');


const router = Router();

// Configurar los routers
router.get('/pokemons', getPokemons);
router.get('/pokemons/:idPokemon', getPokemonById);
router.get('/pokemons/', getPokemonByName);
router.post('/pokemons', createPokemon);
router.get('/types', getTypes);

// Ejemplo: router.use('/auth', authRouter);


module.exports = router;
