const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const mongoose = require('mongoose');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(bodyParser.json());
app.use(cors());

// MongoDB Atlas connection URI
const MONGO_URI = process.env.MONGO_URI || 'mongodb+srv://abyg76636:Papaishandsome1!@cluster0.mi49c.mongodb.net/';

// Connect to MongoDB Atlas
mongoose.connect(MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
});

// Check if MongoDB is connected successfully
const db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB connection error:'));
db.once('open', () => {
    console.log('Connected to MongoDB Atlas');
});

// Define MongoDB schema and model
const RecipeSchema = new mongoose.Schema({
    name: { type: String, required: true },
    ingredients: [{
        name: { type: String, required: true },
        measurement: { type: String, default: '' }
    }],
    instructions: { type: String, required: true },
    cookTime: { type: String, required: true },
    description: { type: String, required: true },
    imageUrl: { type: String, default: '' },
    videoUrl: { type: String, default: '' }
});

const Recipe = mongoose.model('Recipe', RecipeSchema);

// Routes

// Endpoint to fetch recipes matching specified ingredients
app.post('/api/recipes', async (req, res) => {
    let { ingredients } = req.body;

    if (!Array.isArray(ingredients)) {
        ingredients = [ingredients];
    }

    try {
        let query = Recipe.find();
        query = query.where('ingredients.name').all(ingredients);

        const recipes = await query.exec();

        const result = recipes.map(recipe => ({
            _id: recipe._id,
            name: recipe.name,
            ingredients: recipe.ingredients.map(ing => ing.name + (ing.measurement ? ` (${ing.measurement})` : '')),
            instructions: recipe.instructions,
            cookTime: recipe.cookTime,
            description: recipe.description,
            imageUrl: recipe.imageUrl,
            videoUrl: recipe.videoUrl
        }));

        res.json(result);
    } catch (error) {
        console.error('Error fetching recipes:', error);
        res.status(500).json({ error: 'Failed to fetch recipes' });
    }
});

// Endpoint to add a new recipe
app.post('/api/add-recipe', async (req, res) => {
    const { name, ingredients, instructions, cookTime, description, imageUrl, videoUrl } = req.body;
    try {
        const newRecipe = new Recipe({
            name,
            ingredients,
            instructions,
            cookTime,
            description,
            imageUrl,
            videoUrl
        });
        await newRecipe.save();
        res.json(newRecipe);
    } catch (error) {
        console.error('Error saving recipe:', error);
        res.status(500).json({ error: 'Failed to save recipe' });
    }
});

// Endpoint to fetch all recipes
app.get('/api/all-recipes', async (req, res) => {
    try {
        const recipes = await Recipe.find();
        res.json(recipes);
    } catch (error) {
        console.error('Error fetching all recipes:', error);
        res.status(500).json({ error: 'Failed to fetch recipes' });
    }
});

// Endpoint to fetch a single recipe by ID
app.get('/api/recipe/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const recipe = await Recipe.findById(id);
        if (!recipe) {
            return res.status(404).json({ error: 'Recipe not found' });
        }
        res.json({
            _id: recipe._id,
            name: recipe.name,
            ingredients: recipe.ingredients,
            instructions: recipe.instructions,
            cookTime: recipe.cookTime,
            description: recipe.description,
            imageUrl: recipe.imageUrl,
            videoUrl: recipe.videoUrl
        });
    } catch (error) {
        console.error('Error fetching recipe:', error);
        res.status(500).json({ error: 'Failed to fetch recipe' });
    }
});

// Endpoint to delete all recipes
app.delete('/api/delete-all-recipes', async (req, res) => {
    try {
        await Recipe.deleteMany({});
        res.json({ message: 'All recipes deleted successfully' });
    } catch (error) {
        console.error('Error deleting recipes:', error);
        res.status(500).json({ error: 'Failed to delete recipes' });
    }
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
