document.addEventListener('DOMContentLoaded', () => {
    const isRecipeDetailsPage = window.location.pathname.includes('recipe-details.html');

    if (isRecipeDetailsPage) {
        loadRecipeDetails();
    } else {
        loadAllRecipes();
        setupIngredientForm();
    }

    // Consolidate all event listeners into a single DOMContentLoaded listener
    setupEventListeners();
});

function setupEventListeners() {
    // Event listener to handle recipe details view button clicks
    document.body.addEventListener('click', async (event) => {
        if (event.target.classList.contains('view-recipe-button')) {
            const recipeId = event.target.getAttribute('data-id');
            viewRecipeDetails(recipeId);
        }
    });

    // Handle measurement popup interaction
    const measurementBtn = document.getElementById('measurement-btn');
    const measurementPopup = document.getElementById('measurement-popup');
    if (measurementBtn && measurementPopup) {
        const closeBtn = measurementPopup.querySelector('.close');
        measurementBtn.addEventListener('click', () => {
            measurementPopup.style.display = 'block';
        });
        closeBtn.addEventListener('click', () => {
            measurementPopup.style.display = 'none';
        });
    }
}

// Function to fetch all recipes from the API
async function loadAllRecipes() {
    try {
        const response = await fetch('http://localhost:5000/api/all-recipes');
        const recipes = await response.json();
        displayRecipes(recipes);
    } catch (error) {
        console.error('Error fetching all recipes:', error);
    }
}

// Function to setup ingredient form submission
function setupIngredientForm() {
    const ingredientForm = document.getElementById('ingredient-form');
    if (ingredientForm) {
        ingredientForm.addEventListener('submit', async function(event) {
            event.preventDefault();
            const ingredientsInput = document.getElementById('ingredients');
            const ingredients = ingredientsInput.value.trim().split(',').map(ingredient => ingredient.trim());
            if (ingredients.length > 0 && ingredients[0]) {
                await fetchRecipes(ingredients);
            } else {
                console.warn('Please enter at least one ingredient.');
            }
        });
    } else {
        console.error('Ingredient form element not found.');
    }
}

// Function to fetch recipes based on ingredients
async function fetchRecipes(ingredients) {
    try {
        const response = await fetch('http://localhost:5000/api/recipes', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ ingredients })
        });
        const recipes = await response.json();
        displayRecipes(recipes);
    } catch (error) {
        console.error('Error fetching recipes:', error);
    }
}

// Function to display recipes in the UI
function displayRecipes(recipes) {
    const resultsDiv = document.getElementById('recipe-results');
    if (!resultsDiv) {
        console.error('Results div element not found.');
        return;
    }
    resultsDiv.innerHTML = '<h2>Recipes you can make:</h2>';
    if (recipes.length === 0) {
        resultsDiv.innerHTML += '<p>No recipes found.</p>';
    } else {
        resultsDiv.innerHTML = '';
        recipes.forEach(recipe => {
            const recipeDiv = document.createElement('div');
            recipeDiv.classList.add('recipe-card');
            const description = recipe.description ? `<p>${recipe.description}</p>` : '';
            recipeDiv.innerHTML = `
                <h3>${recipe.name}</h3>
                ${description}
                <button class="view-recipe-button" data-id="${recipe._id}">View Recipe</button>
            `;
            resultsDiv.appendChild(recipeDiv);
        });
    }
}

// Function to navigate to recipe details page
function viewRecipeDetails(recipeId) {
    window.location.href = `/recipe-details.html?id=${recipeId}`;
}

// Function to load recipe details for the current page
async function loadRecipeDetails() {
    const urlParams = new URLSearchParams(window.location.search);
    const recipeId = urlParams.get('id');

    try {
        const response = await fetch(`http://localhost:5000/api/recipe/${recipeId}`);
        if (!response.ok) throw new Error('Network response was not ok');
        const recipe = await response.json();
        document.title = recipe.name;
        displayRecipeDetails(recipe);
    } catch (error) {
        console.error('Error fetching recipe details:', error);
        const recipeDetailsDiv = document.getElementById('recipe-details');
        if (recipeDetailsDiv) {
            recipeDetailsDiv.innerHTML = '<p>Error fetching recipe details. Please try again later.</p>';
        }
    }
}

// Function to display recipe details in the UI
function displayRecipeDetails(recipe) {
    const recipeDetailsDiv = document.getElementById('recipe-details');

    if (!recipe) {
        recipeDetailsDiv.innerHTML = '<p>Recipe not found.</p>';
        return;
    }

    let videoEmbedHtml = '';
    if (recipe.videoUrl) {
        const videoIdMatch = recipe.videoUrl.match(/(?:https?:\/\/)?(?:www\.)?youtube\.com\/watch\?v=([^&]+)/);
        if (videoIdMatch) {
            const videoId = videoIdMatch[1];
            videoEmbedHtml = `<iframe width="560" height="315" src="https://www.youtube.com/embed/${videoId}" frameborder="0" allowfullscreen></iframe>`;
        } else {
            videoEmbedHtml = `<p><strong>Video:</strong> <a href="${recipe.videoUrl}" target="_blank">Watch on YouTube</a></p>`;
        }
    }

    // Build ingredients list HTML
    let ingredientsList = '';
    recipe.ingredients.forEach(ingredient => {
        ingredientsList += `<li>${ingredient.name}${ingredient.measurement ? ` (${ingredient.measurement})` : ''}</li>`;
    });

    recipeDetailsDiv.innerHTML = `
        <h2>${recipe.name}</h2>
        ${recipe.imageUrl ? `<img src="${recipe.imageUrl}" alt="${recipe.name}">` : ''}
        <p><strong>Description:</strong> ${recipe.description}</p>
        <p><strong>Cook Time:</strong> ${recipe.cookTime}</p>
        <h3>Ingredients:</h3>
        <div class="ingredients-container">
            <ul>${ingredientsList}</ul>
        </div>
        <h3>Instructions:</h3>
        <p>${recipe.instructions}</p>
        ${videoEmbedHtml}
    `;

    // Add style to handle ingredient layout
    const ingredientsContainer = recipeDetailsDiv.querySelector('.ingredients-container');
    if (ingredientsContainer) {
        const ingredientsItems = ingredientsContainer.querySelectorAll('li');
        if (ingredientsItems.length > 6) {
            ingredientsContainer.classList.add('multi-column');
        }
    }
}
