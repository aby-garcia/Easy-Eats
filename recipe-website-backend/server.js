const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const mongoose = require('mongoose');

const app = express();
app.use(bodyParser.json());
app.use(cors());

// Use environment variable for MongoDB connection string
const mongoURI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/recipes';
mongoose.connect(mongoURI);

mongoose.connection.on('connected', () => {
    console.log(`Mongoose connected to ${mongoURI}`);
});
mongoose.connection.on('error', (err) => {
    console.error(`Mongoose connection error: ${err}`);
});
mongoose.connection.on('disconnected', () => {
    console.log('Mongoose disconnected');
});

// MongoDB schema definition
const RecipeSchema = new mongoose.Schema({
    name: { type: String, required: true },
    ingredients: {
        type: [{
            name: { type: String, required: true },
            measurement: { type: String, default: '' }
        }],
        required: true
    },
    instructions: { type: String, required: true },
    cookTime: { type: String, required: true },
    description: { type: String, required: true },
    imageUrl: { type: String, default: '' },
    videoUrl: { type: String, default: '' }
});

const Recipe = mongoose.model('Recipe', RecipeSchema);

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
app.listen(5000, () => {
    console.log('Server is running on http://localhost:5000');
});
