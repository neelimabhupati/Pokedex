function createCharacterCardHTML(index, typesHtml, name, id, imageUrl, cardBgColor) {

    return `
                <div class="character-card" data-id="${id}" 
                    aria-label="Open ${name} details" onclick="openPokemonDialog(${index})">
                <div class="card-header">
                    <span> ID: ${id}</span>
                    <h3 style="text-transform: capitalize;">${name}</h3>
                </div>
            
                <div class="card-img-wrapper" style="background-color: ${cardBgColor} ;" >
                    <img data-id="card-image" src="${imageUrl}" alt="${name}">
                </div>

                <div class="card-types">
                    ${typesHtml}
                </div>
                </div>
            `;
}

function generateStatsHTML(stats) {
    return stats.map(stat => `
            <div class="stat-row">
                <span class="stat-title">${stat.stat.name}</span>
                <div class="stat-bar-bg">
                    <div class="stat-bar-fill" style="width: ${Math.min(stat.base_stat, 100)}%;"></div>
                </div>
            </div>
        `).join('');
}

// async function createEvoItemHTML(pokeName, isLast) {
//     let pokeDetails = await fetch(`https://pokeapi.co/api/v2/pokemon/${pokeName}`);
//     let pokeResonse = await pokeDetails.json();
//     let imgUrl = pokeResonse.sprites.other['official-artwork'].front_default;

//     let arrow = isLast ? '' : `<div class="evo-arrow">≫</div>`;

//     return `
//         <div class="evo-item">
//             <img src="${imgUrl}" alt="${pokeName}">
//             <p style="text-transform: capitalize;">${pokeName}</p>
//         </div>
//         ${arrow}
//     `;
// }

function createEvoItemHTML(pokeName, imgUrl, arrow) {
    return `
        <div class="evo-item">
            <img src="${imgUrl}" alt="${pokeName}">
            <p style="text-transform: capitalize;">${pokeName}</p>
        </div>
        ${arrow}
    `;
}

function createTypeBadgeHTML(typeName, badgeColor) {
    return `<span class="type-badge style="background-color: ${badgeColor};">${typeName}</span>`;
}

