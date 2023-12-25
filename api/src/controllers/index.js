// controllers/index.js
const { Pokemon, Type } = require("../db");
const axios = require('axios');


Pokemon.belongsToMany(Type, { through: 'PokemonType' });
Type.belongsToMany(Pokemon, { through: 'PokemonType' });

let pokemonsCache = null;

const findPokemonsDB = async () => {
    try {
      const pokemons = await Pokemon.findAll({
        attributes: ['id', 'name', 'image', 'hp', 'attack', 'defense', 'speed', 'height', 'weight'],
        include: [
          {
            model: Type,
            attributes: ['name'],
            through: { attributes: [] },
          },
        ],
      });
      
    return pokemons.map(element => {
        const { Types, ...allAttributes } = element.get();
        const typeNames = Types.map(type => type.name);
        return { ...allAttributes, types: typeNames };
    });
      
    } catch (error) {
      return [];
    }
};

const  findPokemonsApi = async () => {
    if (pokemonsCache) {
        return pokemonsCache;
    }

    let pokemonsApi = [];
    let nextUrl = 'https://pokeapi.co/api/v2/pokemon?limit=100';

    while(nextUrl){
        try {
            const { data } = await axios.get(nextUrl);
            const { results, next } = data;

            // [{name,url},{name,url},...]
            const pokemonData = await Promise.all(results.map(async (element) => {
                try {
                    const pokemonUrl = await axios.get(element.url);
                    return pokemonUrl.data;
                } catch (error) {
                    console.log("Problemas al obtener detalles del pokemon");
                    return false
                }
            }));

            for (const element of pokemonData) {
                const { id, name, height, weight, sprites, stats, types } = element;
                const typeNames = types.map((type) => type.type.name);
                const pokemonDetails = {
                id,
                name,
                image: sprites.other.dream_world.front_default,
                hp: stats[0].base_stat,
                attack: stats[1].base_stat,
                defense: stats[2].base_stat,
                speed: stats[5].base_stat,
                height,
                weight,
                types: typeNames
                };

                pokemonsApi.push(pokemonDetails);
            }
            nextUrl = next;  

        } catch (error) {
            console.log("Problemas al obtener detalles del pokemon");
            nextUrl = null; 
        }
    }
    pokemonsCache = pokemonsApi;
    console.log("Pokemons cargados con exito");
    return pokemonsApi;

}

const getPokemons = async (req, res) => {
  try {
      const pokemonsBD = await findPokemonsDB();
      const pokemonsApi = await findPokemonsApi();
      const allPokemons = [...pokemonsBD, ...pokemonsApi];
      const {name} = req.query;

      if(!name) {
          res.status(200).json(allPokemons);
      } else {
          //let pokemonDetail = allPokemons.find(element => element.name.toLowerCase() === name.toLowerCase());
          let pokemonDetail = allPokemons.filter(element => element.name.match(name.toLowerCase()));
          if (pokemonDetail.length > 0) {
              res.status(200).json(pokemonDetail);
          } else {
              res.status(404).json({ msg: 'The pokemon with the given name does not exist' });
          }
      }    
  } catch (error) {
      res.status(500).json({ msg: 'Problems with the data of Pokemons' });
  }



};
const getPokemonById = async (req, res) => {
  const { idPokemon } = req.params;
  let pokemonDB, pokemonApi;

  try {
    // Intenta buscar el Pokemon en la base de datos
    const pokemonsDB = await findPokemonsDB();
    pokemonDB = pokemonsDB.find(pokemon => pokemon.id === parseInt(idPokemon));

    // Busca en la API externa
    const pokemonsApi = await findPokemonsApi();
    pokemonApi = pokemonsApi.find(pokemon => pokemon.id === parseInt(idPokemon));

    if (!pokemonDB && !pokemonApi) {
      // Si no se encuentra el Pokemon en ninguna parte, devuelve un error
      return res.status(404).json({ error: 'Pokemon not found' });
    }

    // Devuelve los Pokemon encontrados
    return res.json({ pokemonDB, pokemonApi });
  } catch (error) {
    return res.status(500).json({ error: 'An error occurred while trying to fetch the Pokemon' });
  }
};
const getPokemonByName = async (req, res, next) => {
  try {
    const name = req.query.name;

    if (name) {
      const pokemon = await Pokemon.findOne({ where: { name: name.toLowerCase() } });

      if (pokemon) {
        res.json(pokemon);
      } else {
        res.status(404).send('Pokemon no encontrado');
      }
    } else {
      const pokemons = await Pokemon.findAll();
      res.json(pokemons);
    }
  } catch (error) {
    next(error);
  }
};
const createPokemon = async (req, res) => {
  const { id, name, imagen, life, attack, defense, speed, height, weight, type } = req.body;
  console.log("prueba", req.body);

  try {
    // Crear el Pokemon
    const newPokemon = await Pokemon.create({
      id,
      name,
      imagen,
      life: parseInt(life),
      attack: parseInt(attack),
      defense: parseInt(defense),
      speed: parseInt(speed),
      height: parseInt(height),
      weight: parseInt(weight)
    });

    // Buscar los tipos y asociarlos con el Pokemon
    for (let typeName of type) {
      const type = await Type.findOne({ where: { name: typeName } });
      if (type) {
        await newPokemon.addType(type);
      }
    }

    // Devolver el Pokemon creado
    res.status(201).json(newPokemon);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'An error occurred while trying to create the Pokemon' });
  }
};



const getTypes = async (req, res, next) => {
  try {
    // Intenta obtener los tipos de Pokemon de la base de datos
    let types = await Type.findAll();

    if (types.length) {
      // Si los encuentras, devuélvelos
      res.json(types);
    } else {
      // Si no los encuentras en la base de datos, haz una solicitud a la API externa
      const response = await axios.get('https://pokeapi.co/api/v2/type');

      if (response.data.results) {
        // Si la API externa devuelve los tipos de Pokemon, guárdalos en tu base de datos
        types = response.data.results.map(result => ({ name: result.name }));
        try {
          await Type.bulkCreate(types);
        } catch (error) {
          console.error('Error al guardar los tipos en la base de datos:', error);
        }
        // Luego de guardarlos, devuélvelos
        res.json(types);
      } else {
        // Si la API externa no devuelve los tipos de Pokemon, devuelve un error
        res.status(404).send('Tipos de Pokemon no encontrados');
      }
    }
  } catch (error) {
    next(error);
  }
};



module.exports = {
  getPokemons,
  getPokemonById,
  getPokemonByName,
  createPokemon,
  getTypes
};