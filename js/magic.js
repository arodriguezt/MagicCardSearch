function transformar_text(text_simbols) {
  //Convertim els salts de línia a format HTML

  text_transformat = text_simbols.replace(/\r?\n/g, "<br>");
  //Cerquem el text a transformar
  var trobar = /\{[A-Z0-9/]*\}/g;
  //Canviem el text per les imatges corresponents
  var text_transformat = text_transformat.replace(trobar, function (x) {
    //Afagem el text de dintre de les {} treient les / interiors (si hi ha alguna)
    var lletres = x.substring(1, x.length - 1).replace("/", "");
    return (
      "<img src='https://c2.scryfall.com/file/scryfall-symbols/card-symbols/" +
      lletres +
      ".svg' class='mana-icon'>"
    );
  });
  return text_transformat;
}
$(document).ready(function () {
  const divCartes = $("#cartes");
  //Eliminem les dues cartes del principi
  $(".carta").remove();

  $("#cercar").click(function () {
    //Input del nom carta
    var searchText = $("#nom").val();
    var checkedCheckboxes = $("input[type='checkbox']:checked");
    var checkboxValues = "";
    //Iterem les checkboxes per comprobar les que estan clicades
    checkedCheckboxes.each(function () {
      checkboxValues += $(this).val();
    });
    var url = "https://api.scryfall.com/cards/search?q=";
    var params = "";
    //Si hi ha algo escrit al input del nom l'afegim
    if (searchText) {
      params += searchText;
    }
    //Si hi ha alguna checkbox clicada afegim el seu valor
    if (checkboxValues != "") {
      params += " c:" + checkboxValues;
    }
    //Al tenir algun parametre fem la peticio a l'api

    if (params) {
      url += "?" + params;
      decodedUrl = decodeURIComponent(url);
      $.get(
        decodedUrl,
        function (responseJson) {
          //Buidem les cartes de l'anterior recerca
          divCartes.empty();

          //Mapejem cada carta i creem la carta amb la funcio createCard
          responseJson.data.map((carta) => {
            divCartes.append(createCard(carta));
          });

          // Afegim click event a .opcions
          $(".opcions").click(function () {
            actualitzarCartaActual(this.parentNode);
          });
        },
        "json"
      );
    }
  });
});

function createCard(carta) {
  const name = getCardProperty(carta, "name", null);
  const mana = getCardProperty(carta, "mana_cost", null);
  const type = getCardProperty(carta, "type_line", null);
  //No podem fer servir la funcio getCardProperty ja que property son dos elements de l'arbre de la carta
  //Verifiquem que la carta tingui el art_crop en image_uris si no la tenim a la face de la carta
  //L'unic que no mostrem l'altre face de la carta
  const imatge = carta.image_uris
    ? carta.image_uris.art_crop
    : carta.card_faces[0].image_uris.art_crop;
  const oracle_text = getCardProperty(carta, "oracle_text", null);
  const flavor_text = getCardProperty(carta, "flavor_text", null);
  const color = getCardProperty(carta, "colors", null);
  const power = getCardProperty(carta, "power", null);
  const toughness = getCardProperty(carta, "toughness", null);

  //Creem les etiquetes necessaries per mostrar la carta
  const card = $("<div>")
    .addClass("carta")
    .attr("color", changeColorLetterToWord(color));

  const cardBackground = $("<div>").addClass("fons-carta");
  card.append(cardBackground);

  const cardFrame = $("<div>").addClass("card-frame");
  cardBackground.append(cardFrame);

  const opcions = $("<div>").addClass("opcions");
  cardFrame.append(opcions);

  const botoRandom = $("<span>").addClass("fas fa-recycle");
  opcions.append(botoRandom);

  const cardContent = $("<div>").addClass("contingut-carta");
  cardFrame.append(cardContent);

  const cardName = $("<h1>").addClass("nom").text(name);
  cardContent.append(cardName);

  const manaContainer = $("<div>").addClass("mana");
  //Si mana te algun value aleshores transformem el text en imatges
  if (mana) {
    manaContainer.html(transformar_text(mana));
  }
  cardContent.append(manaContainer);

  const cardImage = $("<img>").addClass("imatge-carta").attr("src", imatge);
  cardFrame.append(cardImage);

  const cardType = $("<div>").addClass("tipus-carta");
  cardFrame.append(cardType);

  const cardTypeHeading = $("<h1>").addClass("type").text(type);
  cardType.append(cardTypeHeading);

  const cardText = $("<div>").addClass("text-carta");
  cardFrame.append(cardText);

  const cardDescription = $("<p>").addClass("descripcio marge-intern");
  //Si oracle_text te algun value transformem el text
  if (oracle_text) {
    cardDescription.html(transformar_text(oracle_text));
  }
  cardText.append(cardDescription);
  //Si flavor_text te algun valor creem l'element
  if (flavor_text) {
    const cardFlavorText = $("<p>")
      .addClass("descripcio marge-intern")
      .text(flavor_text);
    cardText.append(cardFlavorText);
  }

  const cardInfo = $("<div>").addClass("informacio-inferior marge-dintre");
  cardFrame.append(cardInfo);

  //Si tenim valor en power i toughness creem les etiquetes per mostrarles
  if (power && toughness) {
    const cardBattle = $("<div>").addClass("batalla");
    cardInfo.append(cardBattle);

    const cardPower = $("<span>").addClass("power").text(power);
    cardBattle.append(cardPower);

    const slash = document.createTextNode("/");
    cardBattle.append(slash);

    const cardToughness = $("<span>").addClass("toughness").text(toughness);
    cardBattle.append(cardToughness);
  }
  return card;
}

function changeColorLetterToWord(color) {
  switch (color[0]) {
    case "R":
      return "red";
      break;
    case "W":
      return "white";
      break;
    case "U":
      return "blue";
      break;
    case "B":
      return "black";
      break;
    case "G":
      return "green";
      break;
  }
}
//Comprobem que la propietat estigui en l'arrel principal de la carta, en cas de que no estigui
// mirem l'arrel de la face de la carta, si no hi es en ninguna retornem el defaultValue
function getCardProperty(card, property, defaultValue) {
  if (card[property]) {
    return card[property];
  } else if (card.card_faces && card.card_faces[0][property]) {
    return card.card_faces[0][property];
  } else {
    return defaultValue;
  }
}

function actualitzarCartaActual(carta) {
  //Fem la peticio ajax get
  $.get("https://api.scryfall.com/cards/random", function (data) {
    //Canviem el color de div.carta
    $(carta).parent().parent().attr("color",changeColorLetterToWord(data.color_identity));
    //Canviem el color de div.card-frame
    carta.setAttribute("color", changeColorLetterToWord(data.color_identity));
    carta.querySelector(".nom").textContent = data.name;
    carta
      .querySelector(".imatge-carta")
      .setAttribute("src", data.image_uris.art_crop);
    carta.querySelector(".type").textContent = data.type_line;

    const manaContainer = carta.querySelector(".mana");
    //Si te mana cost el modifiquem
    if (data.mana_cost) {
      manaContainer.innerHTML = transformar_text(data.mana_cost);
    } else {
      manaContainer.innerHTML = "";
    }
    
    let cardOracleText = $(carta).find(".text-carta .descripcio.marge-intern");
    //Si trobem un p.descripcio.marge-intern el removem, en cas de que la carta no en tingui el creem
    if(!cardOracleText){      
      cardOracleText = $("<p>")
        .addClass("descripcio marge-intern")
        .appendTo(carta.querySelector(".text-carta"));
    }else{
      cardOracleText.remove();
    }
    //Si la nova carta te text l'afegim
    if(data.oracle_text){
      cardOracleText = $("<p>")
        .addClass("descripcio marge-intern")
        .appendTo(carta.querySelector(".text-carta"));
      cardOracleText.html(transformar_text(data.oracle_text));
    } else {
      //Si no te el removem
      cardOracleText.remove();
    }

    let cardFlavorText = carta.querySelector(".flavor-text");
    //Si no existeix afegim el flavor text
    if (!cardFlavorText) {
      const cardText = carta.querySelector(".text-carta");
      cardFlavorText = $("<p>")
        .addClass("descripcio marge-intern")
        .appendTo(cardText);
    }
    if (data.flavor_text) {
      cardFlavorText.text(data.flavor_text);
    } else {
      cardFlavorText.remove();
    }


    let cardBattle = $(".batalla", carta);
    //En cas de que div.batall no existeixi pero la nova carta sigui una criatura afegim el div.batalla i el power / toughness
    if (!cardBattle.length && data.power) {
      const cardInfo = $(".informacio-inferior", carta);
      cardBattle = $("<div>").addClass("batalla");
      cardInfo.append(cardBattle);

      const cardPower = $("<span>").addClass("power").text(data.power);
      cardBattle.append(cardPower);

      const slash = document.createTextNode("/");
      cardBattle.append(slash);

      const cardToughness = $("<span>")
        .addClass("toughness")
        .text(data.toughness);
      cardBattle.append(cardToughness);
      //Si tenim el div.batalla pero la nova carta no es una criatura removem el div.batalla
    } else if (cardBattle.length && data.power == undefined) {
      cardBattle.remove();
      //Si tenim el div.batalla i es una criatura actualitzem els valors
    } else {
      const cardPower = $(".power", carta);
      const cardToughness = $(".toughness", carta);
      cardPower.text(data.power);
      cardToughness.text(data.toughness);
    }
  });
}
