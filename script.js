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

function renderCharacters(characters) {
    currentDisplayedList = characters; 
    let container = document.getElementById('character-container');
    if (!container)
        return;
    container.innerHTML = '';

    characters.forEach((char, index) => {

        let typesHtml = getTypesHtml(char.types);
        let primaryType = char.types[0].type.name;
        let name = char.name;
        let id = char.id;
        let imageUrl = char.sprites.other['official-artwork'].front_default;
        let cardBgColor = TYPE_COLORS[primaryType.toLowerCase()] || '#78C850';

        container.innerHTML += createCharacterCardHTML(id, typesHtml, name, id, imageUrl, cardBgColor);
    });
}

function openPokemonDialog(pokemonId) {
    currentIndex = currentDisplayedList.findIndex(p => p.id === pokemonId);
    let pokemon = currentDisplayedList[currentIndex];

    if (!pokemon) {
        console.error("Pokemon not found with id:", pokemonId);
        return;
    }

    document.getElementById('dialogName').textContent = pokemon.name;
    document.getElementById('dialogImage').src = pokemon.sprites.other['official-artwork'].front_default;
    renderPokemonDetails(pokemon);
    switchTab('tab-main', 'btn-main');

    if (dialog) {
        dialog.showModal();
    } else {
        console.error("dialog not found in html!");
    }
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

async function renderEvolutionChain(pokemon) {
    const evoContainer = document.getElementById('evoContainer');
    if (!evoContainer) return;

    evoContainer.innerHTML = 'Loading evolution...';

    try {
        let evoChainNames = await fetchEvolutionNames(pokemon);
        let evoItemsData = await fetchEvoItemsDetails(evoChainNames);

        let evoHtmlArray = evoItemsData.map((item, i) => {
            let isLast = i === evoItemsData.length - 1;
            let arrow = isLast ? '' : '<div class="evo-arrow">>>></div>';
            return createEvoItemHTML(item.name, item.imgUrl, arrow);
        });

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

function validateInputAmount(amount, loadMsg) {
    if (isNaN(amount) || amount <= 0) return false;

    if (amount > 11) {
        if (loadMsg) {
            loadMsg.style.color = 'red';
            loadMsg.textContent = 'Please enter below 11';
        }
        return false;
    }

    if (loadMsg) {
        loadMsg.style.color = 'green';
        loadMsg.textContent = 'Enter your wished list to load more';
    }
    return true;
}

function setLoadButtonState(loadMoreBtn, disabled) {
    if (!loadMoreBtn) return;
    loadMoreBtn.disabled = disabled;
    loadMoreBtn.style.backgroundColor = disabled ? '#888888' : '';
    loadMoreBtn.style.cursor = disabled ? 'not-allowed' : 'pointer';
}

async function loadMorePokemon() {
    if (isLoading) return;

    let amountInput = document.getElementById('loadAmountInput');
    let loadMoreBtn = document.getElementById('loadMoreBtn');
    let loadMsg = document.getElementById('loadMsg');
    let amount = parseInt(amountInput.value);

    if (!validateInputAmount(amount, loadMsg)) return;

    isLoading = true;
    setLoadButtonState(loadMoreBtn, true);

    try {
        await fetchSequentialPokemon(amount);
    } catch (error) {
        console.error("Error loading pokemon:", error);
    } finally {
        isLoading = false;
        setLoadButtonState(loadMoreBtn, false);
    }
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
    let loadMoreBtn = document.getElementById('loadMoreBtn');
    let loadAmountInput = document.getElementById('loadAmountInput');
    let homeBtn = document.getElementById('homeBtn');
    let loadMsg = document.getElementById('loadMsg');

    if (loadMoreBtn) loadMoreBtn.style.display = 'none';
    if (loadAmountInput) loadAmountInput.style.display = 'none';
    if (homeBtn) homeBtn.style.display = 'inline-block';
    if (loadMsg) loadMsg.style.display = 'none'; // Search lo unnappudu message hide avthundi
}

async function fetchAndRenderFromAPI(query) {
    try {
        let response = await fetch(`https://pokeapi.co/api/v2/pokemon/${query}`);
        if (!response.ok)
            throw new Error("Data Not found");

        let pokemonData = await response.json();

        renderCharacters([pokemonData]);
        showSearchUI();
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
    if (loadMsg) loadMsg.style.display = 'block'; // Home ki vachaka malli message kanipistundi

    renderCharacters(pokemonList);
}