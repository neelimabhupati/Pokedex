let pokemonList = [];
let currentDisplayedList = [];
const dialog = document.getElementById('pokemonDialog');
let currentIndex = 0;
let currentOffset = 0;
let isLoading = false;

async function init() {
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

function getTypesHtml(types) {
    return types.map(t => {
        let typeName = t.type.name;
        let badgeColor = TYPE_COLORS[typeName.toLowerCase()] || '#777';

        return createTypeBadgeHTML(typeName, badgeColor);
    }).join('');
}

function createCharacterCardMarkup(character, index) {
    const typesHtml = getTypesHtml(character.types);
    const primaryType = character.types[0].type.name;
    const cardBgColor = TYPE_COLORS[primaryType.toLowerCase()] || '#78C850';
    const imageUrl = character.sprites.other['official-artwork'].front_default;

    return createCharacterCardHTML(
        character.id,
        typesHtml,
        character.name,
        character.id,
        imageUrl,
        cardBgColor,
        index
    );
}

function renderCharacters(characters) {
    currentDisplayedList = characters;

    const container = document.getElementById('character-container');
    if (!container) return;

    container.innerHTML = characters
        .map((character, index) => createCharacterCardMarkup(character, index))
        .join('');
}

function getDisplayedPokemon(pokemonId) {
    currentIndex = currentDisplayedList.findIndex(pokemon => pokemon.id === pokemonId);
    return currentDisplayedList[currentIndex];
}

function updatePokemonDialogContent(pokemon) {
    document.getElementById('dialogName').textContent = pokemon.name;
    document.getElementById('dialogImage').src =
        pokemon.sprites.other['official-artwork'].front_default;

    renderPokemonDetails(pokemon);
    switchTab('tab-main', 'btn-main');
}

function showPokemonDialog(pokemon) {
    if (!dialog) {
        console.error('dialog not found in html!');
        return;
    }

    const primaryType = pokemon.types[0].type.name;
    const typeColor = TYPE_COLORS[primaryType.toLowerCase()] || '#78C850';

    dialog.style.backgroundColor = typeColor;
    dialog.showModal();
}

function openPokemonDialog(pokemonId) {
    const pokemon = getDisplayedPokemon(pokemonId);

    if (!pokemon) {
        console.error('Pokemon not found with id:', pokemonId);
        return;
    }

    updatePokemonDialogContent(pokemon);
    showPokemonDialog(pokemon);
}

async function fetchEvolutionNames(pokemon) {
    let speciesResponse = await fetch(pokemon.species.url);
    let speciesData = await speciesResponse.json();
    let evoResponse = await fetch(speciesData.evolution_chain.url);
    let evoData = await evoResponse.json();
    return extractEvoNames(evoData.chain);
}

async function fetchEvoItemsDetails(evoChainNames) {
    return await Promise.all(
        evoChainNames.map(async (name) => {
            let res = await fetch(`https://pokeapi.co/api/v2/pokemon/${name}`);
            let data = await res.json();
            return {
                name: name,
                imgUrl: data.sprites.other['official-artwork'].front_default
            };
        })
    );
}

function createEvolutionChainHTML(evoItemsData) {
    return evoItemsData.map((item, index) => {
        const isLast = index === evoItemsData.length - 1;
        const arrow = isLast ? '' : '<div class="evo-arrow">>>></div>';

        return createEvoItemHTML(item.name, item.imgUrl, arrow);
    }).join('');
}

async function renderEvolutionChain(pokemon) {
    const evoContainer = document.getElementById('evoContainer');
    if (!evoContainer) return;

    evoContainer.innerHTML = 'Loading evolution...';

    try {
        const evoChainNames = await fetchEvolutionNames(pokemon);
        const evoItemsData = await fetchEvoItemsDetails(evoChainNames);
        evoContainer.innerHTML = createEvolutionChainHTML(evoItemsData);
    } catch (error) {
        console.error('Evolution data error', error);
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
    if (currentDisplayedList.length === 0) return;

    if (currentIndex < currentDisplayedList.length - 1) {
        currentIndex++;
    } else {
        currentIndex = 0;
    }
    let nextPokemon = currentDisplayedList[currentIndex];
    if (nextPokemon) {
        openPokemonDialog(nextPokemon.id);
    }
}

function showPrevPokemon() {
    if (currentDisplayedList.length === 0) return;

    if (currentIndex > 0) {
        currentIndex--;
    } else {
        currentIndex = currentDisplayedList.length - 1;
    }
    let prevPokemon = currentDisplayedList[currentIndex];
    if (prevPokemon) {
        openPokemonDialog(prevPokemon.id);
    }
}

function clickBackgroundClose() {
    const dialogElement = document.getElementById('pokemonDialog');

    if (dialogElement) {
        dialogElement.addEventListener('click', function (event) {
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

async function fetchPokemonPage(count) {
    const response = await fetch(
        `https://pokeapi.co/api/v2/pokemon?limit=${count}&offset=${currentOffset}`
    );
    return await response.json();
}

async function appendPokemonDetails(results) {
    for (let i = 0; i < results.length; i++) {
        const pokemon = results[i];

        const response = await fetch(pokemon.url);
        const details = await response.json();
        pokemonList.push(details);
    }
}

function renderPokemonList() {
    renderCharacters(pokemonList);
}

async function fetchSequentialPokemon(count) {
    try {
        const data = await fetchPokemonPage(count);
        console.log('API Data:', data);

        await appendPokemonDetails(data.results);
        currentOffset += count;
        renderPokemonList();
    } catch (error) {
        console.error('Error fetching sequential pokemon:', error);
    }
}

function setLoadAmountMessage(loadMsg, color, message) {
    if (!loadMsg) return;

    loadMsg.style.color = color;
    loadMsg.textContent = message;
}

function isValidLoadAmount(amount) {
    return !Number.isNaN(amount) && amount > 0 && amount <= 11;
}

function validateInputAmount(amount, loadMsg) {
    if (!isValidLoadAmount(amount)) {
        if (amount > 11) {
            setLoadAmountMessage(loadMsg, 'red', 'Please enter below 11');
        }
        return false;
    }

    setLoadAmountMessage(loadMsg, 'green', 'Enter your wished list to load more');
    return true;
}

function setLoadButtonState(loadMoreBtn, disabled) {
    if (!loadMoreBtn) return;
    loadMoreBtn.disabled = disabled;
    loadMoreBtn.style.backgroundColor = disabled ? '#888888' : '';
    loadMoreBtn.style.cursor = disabled ? 'not-allowed' : 'pointer';
}

function getLoadMoreControls() {
    return {
        amountInput: document.getElementById('loadAmountInput'),
        loadMoreBtn: document.getElementById('loadMoreBtn'),
        loadMsg: document.getElementById('loadMsg')
    };
}

function getLoadAmount(amountInput) {
    return parseInt(amountInput.value, 10);
}

async function loadPokemonAndUpdateButton(amount, loadMoreBtn) {
    isLoading = true;
    setLoadButtonState(loadMoreBtn, true);

    try {
        await fetchSequentialPokemon(amount);
    } catch (error) {
        console.error('Error loading pokemon:', error);
    } finally {
        isLoading = false;
        setLoadButtonState(loadMoreBtn, false);
    }
}

async function loadMorePokemon() {
    if (isLoading) return;

    const controls = getLoadMoreControls();
    const amount = getLoadAmount(controls.amountInput);

    if (!validateInputAmount(amount, controls.loadMsg)) return;

    await loadPokemonAndUpdateButton(amount, controls.loadMoreBtn);
}

function getSearchQuery() {
    const searchInput = document.getElementById('searchInput');
    return searchInput.value.trim().toLowerCase();
}

function findPokemonInList(query) {
    return pokemonList.filter(pokemon => {
        const nameMatches = pokemon.name.toLowerCase().includes(query);
        const idMatches = pokemon.id.toString() === query;

        return nameMatches || idMatches;
    });
}

async function searchPokemon() {
    const query = getSearchQuery();

    if (query.length < 3) {
        renderCharacters(pokemonList);
        return;
    }

    const filteredList = findPokemonInList(query);

    if (filteredList.length > 0) {
        showSearchUI();
        renderCharacters(filteredList);
        return;
    }

    await fetchAndRenderFromAPI(query);
}

function showSearchUI() {
    let loadMoreBtn = document.getElementById('loadMoreBtn');
    let loadAmountInput = document.getElementById('loadAmountInput');
    let homeBtn = document.getElementById('homeBtn');
    let loadMsg = document.getElementById('loadMsg');

    if (loadMoreBtn) loadMoreBtn.style.display = 'none';
    if (loadAmountInput) loadAmountInput.style.display = 'none';
    if (homeBtn) homeBtn.style.display = 'inline-block';
    if (loadMsg) loadMsg.style.display = 'none'; // Search lo unnappudu message hide avthundi
}

async function fetchPokemonFromAPI(query) {
    const response = await fetch(`https://pokeapi.co/api/v2/pokemon/${query}`);

    if (!response.ok) {
        throw new Error('Data not found');
    }

    return await response.json();
}

function renderPokemonSearchResult(pokemon) {
    renderCharacters([pokemon]);
    showSearchUI();
}

function renderPokemonSearchError(query) {
    const container = document.getElementById('character-container');

    if (container) {
        container.innerHTML =
            `<p class="no-results">No Pokémon found for "${query}"</p>`;
    }

    showSearchUI();
}

async function fetchAndRenderFromAPI(query) {
    try {
        const pokemon = await fetchPokemonFromAPI(query);
        renderPokemonSearchResult(pokemon);
    } catch (error) {
        console.error('Error searching for Pokémon:', error);
        renderPokemonSearchError(query);
    }
}

function clearSearchInput() {
    const searchInput = document.getElementById('searchInput');

    if (searchInput) {
        searchInput.value = '';
    }
}

function showHomeControls() {
    const loadMoreBtn = document.getElementById('loadMoreBtn');
    const loadAmountInput = document.getElementById('loadAmountInput');
    const homeBtn = document.getElementById('homeBtn');
    const loadMsg = document.getElementById('loadMsg');

    if (loadMoreBtn) loadMoreBtn.style.display = 'inline-block';
    if (loadAmountInput) loadAmountInput.style.display = 'inline-block';
    if (homeBtn) homeBtn.style.display = 'none';
    if (loadMsg) loadMsg.style.display = 'block';
}

function resetHome() {
    clearSearchInput();
    showHomeControls();
    renderCharacters(pokemonList);
}