let pokemonList = []; // Global variable
const dialog = document.getElementById('pokemonDialog');
let currentIndex = 0;
let currentOffset = 0;
let isLoading = false; 

async function init() {
    pokemonList = [];
    currentOffset = 0;
    let initialCount = parseInt(document.getElementById('loadAmountInput').value) || 11;
    await fetchSequentialPokemon(initialCount);
    clickBackgroundClose();
}

async function fetchCharacters() {
    let response = await fetch('https://pokeapi.co/api/v2/pokemon?limit=11');
    let characters = await response.json();

    console.log("Full Object:", characters);
    let details = await Promise.all(
        characters.results.map(p => fetch(p.url).then(res => res.json()))
    );

    return details;
}

function renderCharacters(characters) {
    let container = document.getElementById('character-container');
    if (!container)
        return;
    container.innerHTML = '';
    characters.forEach((char, index) => {
        container.innerHTML += createCharacterCardHTML(char, index);
    });
}

function openPokemonDialog(index) {
    currentIndex = index;
    let pokemon = pokemonList[index];

    document.getElementById('dialogName').textContent = pokemon.name;
    document.getElementById('dialogImage').src = pokemon.sprites.other['official-artwork'].front_default;
    renderPokemonDetails(pokemon);
    switchTab('tab-main', 'btn-main');

    if (dialog) {
        dialog.showModal();
    } else {
        console.error("not found pokomon id in html!");
    }
}

async function renderEvolutionChain(pokemon) {
    const evoContainer = document.getElementById('evoContainer');
    evoContainer.innerHTML = 'Loading evolution...';

    try {
        let speciesResponse = await fetch(pokemon.species.url);
        let speciesData = await speciesResponse.json();
        let evoResponse = await fetch(speciesData.evolution_chain.url);
        let evoData = await evoResponse.json();
        let evoChainNames = extractEvoNames(evoData.chain);

        let evoHtmlArray = await Promise.all(
            evoChainNames.map((name, i) => createEvoItemHTML(name, i === evoChainNames.length - 1))
        );
        evoContainer.innerHTML = evoHtmlArray.join('');
    } catch (error) {
        console.error("Evolution data error", error);
        evoContainer.innerHTML = 'Evolution details unavailable';
    }
}

function extractEvoNames(chain) {
    let evoChainNames = [];
    let currentChain = chain;
    while (currentChain) {
        evoChainNames.push(currentChain.species.name);
        currentChain = currentChain.evolves_to[0];
    }
    return evoChainNames;
}

function closePokemonDialog() {
    const dialog = document.getElementById('pokemonDialog');
    if (dialog) {
        dialog.close();
    }
}

function showNextPokemon() {
    if (currentIndex < pokemonList.length - 1) {
        openPokemonDialog(currentIndex + 1);
    } else {
        openPokemonDialog(0);
    }
}

function showPrevPokemon() {
    if (currentIndex > 0) {
        openPokemonDialog(currentIndex - 1);
    } else {
        openPokemonDialog(pokemonList.length - 1);
    }
}

function clickBackgroundClose() {
    const dialogElement = document.getElementById('pokemonDialog');

    if (dialogElement) {
        dialogElement.addEventListener('click', function (event) {
            // Click chesindi exact ga dialog background paina aithe close chestham
            if (event.target === dialogElement) {
                dialogElement.close();
            }
        });
    }
}

function switchTab(activeTabId, activeBtnId) {
    const allContents = document.getElementsByClassName('tab-content');
    for (let i = 0; i < allContents.length; i++) {
        allContents[i].style.display = 'none';
    }

    const allButtons = document.getElementsByClassName('tab-btn');
    for (let i = 0; i < allButtons.length; i++) {
        allButtons[i].classList.remove('active');
    }

    document.getElementById(activeTabId).style.display = 'block';
    document.getElementById(activeBtnId).classList.add('active');
}

function renderPokemonDetails(pokemon) {

    if (!pokemon) {
        console.error("Pokemon data is undefined!");
        return;
    }
    renderMainDetails(pokemon);
    document.getElementById('statsContainer').innerHTML = generateStatsHTML(pokemon.stats);
    renderEvolutionChain(pokemon);
}

function renderMainDetails(pokemon) {
    document.getElementById('pokeHeight').textContent = (pokemon.height / 10) + " m";
    document.getElementById('pokeWeight').textContent = (pokemon.weight / 10) + " kg";
    document.getElementById('pokeExp').textContent = pokemon.base_experience;

    let abilityNames = pokemon.abilities.map(a => a.ability.name).join(', ');
    document.getElementById('pokeAbilities').textContent = abilityNames;
}

async function fetchSequentialPokemon(count) {
    try {
        let response = await fetch(`https://pokeapi.co/api/v2/pokemon?limit=${count}&offset=${currentOffset}`);
        let data = await response.json();

        console.log("API Data:", data);
        for (let i = 0; i < data.results.length; i++) {
            let detailRes = await fetch(data.results[i].url);
            let detailData = await detailRes.json();
            pokemonList.push(detailData);
        }
        currentOffset += count;
        renderCharacters(pokemonList);

    } catch (error) {
        console.error("Error fetching sequential pokemon:", error);
    }
}

async function loadMorePokemon() {
    if (isLoading) return;

    let amountInput = document.getElementById('loadAmountInput');
    let amount = parseInt(amountInput.value);

    console.log("Before Fetch - Offset:", currentOffset, "List Length:", pokemonList.length);

    if (isNaN(amount) || amount <= 0) return;
    isLoading = true;

    try {
        if (amount > 0) {
            await fetchSequentialPokemon(amount);
        }
    } catch (error) {
        console.error("Error loading pokemon:", error);
    } finally {
        isLoading = false;
        console.log("After Fetch - Offset:", currentOffset, "List Length:", pokemonList.length);
    }

    console.log("After Fetch - Offset:", currentOffset, "List Length:", pokemonList.length);
}

async function searchPokemon() {
    let searchInput = document.getElementById('searchInput');
    let query = searchInput.value.trim().toLowerCase();

    if (query.length < 3) {
        renderCharacters(pokemonList);
        return;
    }
    let filteredList = pokemonList.filter(pokemon => {
        let nameMatch = pokemon.name.toLowerCase().includes(query);
        let idMatch = pokemon.id.toString() === query;
        return nameMatch || idMatch;
    });

    if (filteredList.length > 0) {
        showSearchUI();
        renderCharacters(filteredList);
    } else {
        fetchAndRenderFromAPI(query);
    }
}

function showSearchUI() {
    // Elements ni mundhe get-element-by-id dwara techukovali
    let loadMoreBtn = document.getElementById('loadMoreBtn');
    let loadAmountInput = document.getElementById('loadAmountInput');
    let homeBtn = document.getElementById('homeBtn');

    if (loadMoreBtn) loadMoreBtn.style.display = 'none';
    if (loadAmountInput) loadAmountInput.style.display = 'none';
    if (homeBtn) homeBtn.style.display = 'inline-block';
}

async function fetchAndRenderFromAPI(query) {
    try {
        let response = await fetch(`https://pokeapi.co/api/v2/pokemon/${query}`);
        if (!response.ok)
            throw new Error("Data Not found");

        let pokemonData = await response.json();

        renderCharacters([pokemonData]);
        showSearchUI(); // API dwara card dhorikina Home button chupistham
    } catch (error) {
        let container = document.getElementById('character-container');
        container.innerHTML = `<p class="no-results">No Pokémon found for "${query}"</p>`;
        showSearchUI();
    }
}

function resetHome() {
    let searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.value = '';
    }
    let loadMoreBtn = document.getElementById('loadMoreBtn');
    let loadAmountInput = document.getElementById('loadAmountInput');
    let homeBtn = document.getElementById('homeBtn');

    if (loadMoreBtn) loadMoreBtn.style.display = 'inline-block';
    if (loadAmountInput) loadAmountInput.style.display = 'inline-block';
    if (homeBtn) homeBtn.style.display = 'none';

    renderCharacters(pokemonList);
}