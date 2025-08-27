// Farm Friends — Animals data (8 animals)
// Added "food" (primary correct choice) for Feed game

const ANIMALS = [
  {
    id: 'cow',
    name: 'Cow',
    image: 'assets/img/cow.png',
    sound: 'assets/audio/cow.mp3',
    color: 'rgb(255, 229, 224)',
    type: 'Mammal',
    habitat: 'Grassy fields and barns',
    diet: 'Grass, hay, grains',
    home: 'Lives in a barn or pasture',
    fun: 'Cows say “moo” and love chewing cud!',
    food: 'grass'
  },
  {
    id: 'pig',
    name: 'Pig',
    image: 'assets/img/pig.png',
    sound: 'assets/audio/pig.mp3',
    color: 'rgb(253, 226, 243)',
    type: 'Mammal',
    habitat: 'Sties on farms',
    diet: 'Vegetables, grains, fruit',
    home: 'Cosy straw-filled pigsty',
    fun: 'Pigs are clever and love mud baths to stay cool!',
    food: 'veggies'
  },
  {
    id: 'chicken',
    name: 'Chicken',
    image: 'assets/img/chicken.png',
    sound: 'assets/audio/chicken.mp3',
    color: 'rgb(255, 243, 205)',
    type: 'Bird',
    habitat: 'Coops and farmyards',
    diet: 'Seeds, grains, insects',
    home: 'Chicken coop with nesting boxes',
    fun: 'Chickens cluck and lay tasty eggs!',
    food: 'seeds'
  },
  {
    id: 'duck',
    name: 'Duck',
    image: 'assets/img/duck.png',
    sound: 'assets/audio/duck.mp3',
    color: 'rgb(209, 247, 255)',
    type: 'Bird',
    habitat: 'Ponds and wetlands',
    diet: 'Plants, seeds, small bugs',
    home: 'Near water with a snug shelter',
    fun: 'Ducks wobble and quack, and love to splash!',
    food: 'plants'
  },
  {
    id: 'sheep',
    name: 'Sheep',
    image: 'assets/img/sheep.png',
    sound: 'assets/audio/sheep.mp3',
    color: 'rgb(232, 245, 233)',
    type: 'Mammal',
    habitat: 'Hills and meadows',
    diet: 'Grass and plants',
    home: 'Fields with a simple shed',
    fun: 'Sheep say “baa” and grow warm wool coats!',
    food: 'grass'
  },
  {
    id: 'goat',
    name: 'Goat',
    image: 'assets/img/goat.png',
    sound: 'assets/audio/goat.mp3',
    color: 'rgb(240, 244, 195)',
    type: 'Mammal',
    habitat: 'Rocky pastures',
    diet: 'Leaves, grass, shrubs',
    home: 'Barns with climbing places',
    fun: 'Goats are great climbers and very curious!',
    food: 'leaves'
  },
  {
    id: 'horse',
    name: 'Horse',
    image: 'assets/img/horse.png',
    sound: 'assets/audio/horse.mp3',
    color: 'rgb(224, 247, 250)',
    type: 'Mammal',
    habitat: 'Fields and stables',
    diet: 'Grass, hay, oats',
    home: 'Stable with roomy stalls',
    fun: 'Horses neigh and love to gallop!',
    food: 'hay'
  },
  {
    id: 'donkey',
    name: 'Donkey',
    image: 'assets/img/donkey.png',
    sound: 'assets/audio/donkey.mp3',
    color: 'rgb(249, 228, 212)',
    type: 'Mammal',
    habitat: 'Dry, open farms',
    diet: 'Hay, grass, straw',
    home: 'Shelter near pasture',
    fun: 'Donkeys bray “hee-haw” and are strong helpers!',
    food: 'hay'
  }
];

// Food bank: id → {label, emoji, why}
// Keep fun, clear explanations for feedback text.
const FOOD = {
  grass:   { label: 'Grass',   emoji: '🌿', why: 'It’s soft and yummy for grazing animals.' },
  hay:     { label: 'Hay',     emoji: '🌾', why: 'Dried grass that’s perfect for stables.' },
  grains:  { label: 'Grains',  emoji: '🌾', why: 'Tiny seeds that give animals energy.' },
  seeds:   { label: 'Seeds',   emoji: '🌱', why: 'Little bites chickens and birds peck at.' },
  insects: { label: 'Insects', emoji: '🐛', why: 'Tiny bugs that some birds snack on.' },
  plants:  { label: 'Plants',  emoji: '🍀', why: 'Leafy greens ducks and others nibble.' },
  leaves:  { label: 'Leaves',  emoji: '🍃', why: 'Crunchy greens goats love to munch.' },
  veggies: { label: 'Veggies', emoji: '🥕', why: 'Tasty vegetables pigs enjoy.' },
  oats:    { label: 'Oats',    emoji: '🥣', why: 'A hearty treat for big animals.' }
};

// Optional: decoy pool preference per animal (fallback uses all)
const FOOD_DECOYS = ['grass','hay','grains','seeds','insects','plants','leaves','veggies','oats'];
