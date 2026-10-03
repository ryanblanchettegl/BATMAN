// Four more promotions for the built-in world (The EWF World). Same shape as the PROMOS entries in build-public-domain.js,
// without the money fields (the builder adds those).
// Row: Name | Gender | Side (F face, H heel, T tweener) | Style | Age | Overness | Work rate | Charisma | Promo | Finisher | extras
// Ring names are plain ASCII, like the rest of the roster. mgr= must be the last extra on a line.
module.exports = [
  // ---------------------------------------------------------------------------------------------------------------
  // NMW: the brand-new startup. Two bought megastars, four names, and a locker room of cheap unknowns.
  { id: 'nmw', name: 'NMW', full_name: 'New Money Wrestling', blurb: 'The startup with the blank cheque. Two megastars, a few names and a locker room of hungry unknowns.',
    owner: { name: 'Jay Gatsby', style: 'stars', roots: 'rebellion', pledge: 'pay' }, staff: { road_agent: 'John L. Sullivan', head_writer: 'Jules Verne' }, announcers: ['Nick Carraway', 'Ambrose Bierce'],
    cities: ['West Egg', 'New York', 'Chicago', 'Louisville', 'Saint Paul', 'San Francisco', 'Dawson City', 'Atlantic City', 'London', 'Paris', 'Monte Carlo', 'Melbourne'],
    shows: [['fri', 'Friday Night Jazz Age', 1]],
    titles: [['nmw_world', 'Green Light World Title', 'M', 3, 0, ['Arsene Lupin']], ['nmw_jazz', 'Jazz Age Title', 'M', 2, 0, ['Wolf Larsen']], ['nmw_women', "Golden Girl Women's Title", 'F', 3, 0, ['Ayesha']], ['nmw_tag', 'East and West Egg Tag Titles', 'M', 2, 1, ['Daniel Dravot', 'Peachey Carnehan']]],
    teams: [['The Men Who Would Be Kings', 'Daniel Dravot', 'Peachey Carnehan', 80, 6], ['Extraordinary Voyages', 'Ned Land', 'Passepartout', 45, 3], ['The Just So Boys', 'Mowgli', "Kimball O'Hara", 25, 4]],
    stables: [['The Gentlemen Burglars', 'Arsene Lupin', ['Arsene Lupin', 'A. J. Raffles', 'Flambeau']]],
    rels: [['Arsene Lupin', 'Professor Challenger', 'rivalry', -75, 7, 'The two cheques the company was built on.'], ['Arsene Lupin', 'A. J. Raffles', 'friendship', 55, 5, 'Professional courtesy.'], ['Tom Buchanan', 'Daisy Buchanan', 'family', 40, 0, 'Married. Careless people.'],
      ['Daniel Dravot', 'Peachey Carnehan', 'friendship', 85, 6, 'They signed a Contrack on it.'], ['Captain Blood', 'Rupert of Hentzau', 'rivalry', -60, 7, ''], ['Henry Higgins', 'Eliza Doolittle', 'mentor', 45, 0, 'He has a bet riding on her.'], ['Wolf Larsen', 'Billy Budd', 'dislike', -50, 2, '']],
    rows: `
Arsene Lupin|M|F|A|34|90|84|96|94|The Hollow Needle|sq=96 cons=88
Professor Challenger|M|H|P|38|88|74|93|92|Maple White Land|sq=94 dur=90 lr=diva pk=29-39 cl=44
Captain Blood|M|F|A|32|76|80|84|82|Arabella's Broadside|safe=86
Wolf Larsen|M|H|P|36|74|76|78|80|The Ghost|dur=92 lr=toxic pk=27-37 cl=42
Ned Kelly|M|T|B|26|72|68|82|76|Glenrowan Stand|dur=94 hc=86
Rupert of Hentzau|M|H|A|23|64|74|88|84|Moat of Zenda|pot=90 sq=86
The Red Baron|M|H|H|25|63|72|80|58|Red Triplane|fl=90 pot=86
Cyrano de Bergerac|M|F|S|36|62|74|88|97|The Envoi|cons=84 pk=27-37 cl=42
Eugen Sandow|M|F|P|35|62|64|82|62|Tomb of Hercules|dur=90 safe=84
Tom Buchanan|M|H|P|30|60|56|66|64|Hulking Brute|lr=toxic mgr=Diamond Jim Brady
The Time Traveller|M|F|T|35|60|70|66|74|Fourth Dimension
Robur the Conqueror|M|H|H|38|58|66|74|82|Clipper of the Clouds|fl=84 pk=29-39 cl=44
A. J. Raffles|M|T|T|33|58|70|80|80|Amateur Cracksman
Ernest Shackleton|M|F|B|40|57|64|76|80|Endurance|st=96 dur=92 lr=leader pk=31-41 cl=46
Daniel Dravot|M|H|P|38|56|62|74|76|Crown of Kafiristan|pk=29-39 cl=44
Scaramouche|M|T|E|25|56|62|84|92|Gift of Laughter|pot=84
Flambeau|M|T|P|36|54|66|72|66|The Flying Stars|pk=27-37 cl=42
Mowgli|M|F|H|19|54|66|76|56|Red Flower|pot=92 sq=84
Peachey Carnehan|M|H|B|36|52|62|64|72|The Contrack|pk=27-37 cl=42
Ned Land|M|F|P|37|52|64|62|56|King of Harpooners|dur=88 pk=28-38 cl=43
Passepartout|M|F|H|25|50|68|72|64|Long Noses Pyramid|fl=86 pot=82
Jim Hawkins|M|F|H|19|50|62|72|66|Apple Barrel|pot=90
Kimball O'Hara|M|F|T|19|48|62|74|72|The Great Game|pot=88
Joseph Rouletabille|M|F|T|20|47|64|66|74|The Yellow Room|pot=86
Billy Budd|M|F|B|21|44|60|74|34|Foretopman's Blow|pot=84
Ayesha|F|H|E|33|78|64|95|90|Pillar of Life|sq=93 pk=25-45 cl=50 lr=diva
Sarah Bernhardt|F|H|E|38|64|48|92|95|Death Scene|lr=diva pk=29-39 cl=44
Daisy Buchanan|F|H|E|23|62|50|90|80|Green Light|sq=88 pot=80
Nellie Bly|F|F|H|25|56|70|76|78|Seventy-Two Days|pot=84 st=86
Carrie Nation|F|T|B|45|55|54|72|84|Hatchetation|hc=82 pk=36-46 cl=50
Jordan Baker|F|T|T|22|54|68|72|66|Bad Lie|pot=84
Eliza Doolittle|F|F|S|20|52|62|80|70|Not Bloody Likely|pot=90 mgr=Henry Higgins
The Patchwork Girl|F|F|H|20|48|64|76|72|Powder of Life|fl=86 pot=86
Annie Edson Taylor|F|F|B|45|45|42|62|66|Over the Falls|dur=97 pk=36-46 cl=50
Diamond Jim Brady|M|H|E|45|58|20|80|84||roles=manager br=25 te=15 fl=10 st=20
Henry Higgins|M|H|E|42|56|20|74|92||roles=manager br=15 te=20 fl=10 st=25` },

  // ---------------------------------------------------------------------------------------------------------------
  // LDD: the lucha spectacle. Flyers and entertainers, three stables, six teams, a soap opera in every feud.
  { id: 'ldd', name: 'LDD', full_name: 'Lucha de los Dioses', blurb: 'The lucha spectacle. Feathered serpents, midnight ghosts and ten-man chaos, with a sponsor on every turnbuckle.',
    owner: { name: 'Jose Guadalupe Posada', style: 'drama', roots: 'rebellion', pledge: 'chance' }, staff: { road_agent: 'Tecun Uman', head_writer: 'Ricardo Palma' }, announcers: ['Inca Garcilaso de la Vega', 'Fernando de Alva Ixtlilxochitl'],
    cities: ['Tenochtitlan', 'Teotihuacan', 'Tula', 'Cholula', 'Chichen Itza', 'Tikal', 'Palenque', 'Copan', 'Cusco', 'Tiwanaku', 'Guatavita', 'Chiloe'],
    shows: [['sat', 'Sabado de los Dioses', 1], ['wed', 'Miercoles de Mitos', 0.6]],
    titles: [['ldd_world', 'Quinto Sol World Title', 'M', 3, 0, ['Tezcatlipoca']], ['ldd_jade', 'Jade Mask Title', 'M', 2, 0, ['Camazotz']], ['ldd_gold', 'Guatavita Gold Title', 'M', 1, 0, ['El Dorado']], ['ldd_women', "Silver Moon Women's Title", 'F', 3, 0, ['Coyolxauhqui']], ['ldd_tag', 'Ballcourt Tag Titles', 'M', 2, 1, ['Hunahpu', 'Xbalanque']]],
    teams: [['The Hero Twins', 'Hunahpu', 'Xbalanque', 92, 8], ['The Lords of Xibalba', 'Hun-Came', 'Vucub-Came', 85, 5], ['Sons of Seven Macaw', 'Zipacna', 'Cabrakan', 70, 4], ['Los Cadejos', 'El Cadejo Blanco', 'El Cadejo Negro', 50, -3], ['Los Encantados', 'Curupira', 'Boto Encantado', 40, 3], ['Las Aparecidas', 'La Siguanaba', 'La Lechuza', 55, 4]],
    stables: [['Xibalba', 'Hun-Came', ['Hun-Came', 'Vucub-Came', 'Camazotz']], ['Los Espantos', 'El Charro Negro', ['El Charro Negro', 'El Sombreron', 'El Silbon', 'El Cadejo Negro']], ['Tahuantinsuyo', 'Manco Capac', ['Manco Capac', 'Ollantay', 'Naylamp']]],
    rels: [['Quetzalcoatl', 'Tezcatlipoca', 'rivalry', -90, 9, 'They have ended four worlds between them.'], ['Quetzalcoatl', 'Xolotl', 'family', 60, 5, 'Twins. The morning star and the evening star.'], ['Huitzilopochtli', 'Coyolxauhqui', 'family', -85, 7, 'Brother and sister. Ask about Coatepec.'],
      ['Coatlicue', 'Huitzilopochtli', 'family', 80, 0, 'Mother and son.'], ['Coatlicue', 'Coyolxauhqui', 'family', -60, 3, 'Mother and daughter.'], ['Hunahpu', 'Xbalanque', 'family', 95, 8, 'The Hero Twins.'], ['Xquic', 'Hunahpu', 'family', 85, 0, 'Mother of the twins.'],
      ['Hunahpu', 'Camazotz', 'rivalry', -80, 7, 'He lost his head in the House of Bats.'], ['Mictlantecuhtli', 'Mictecacihuatl', 'partners', 80, 3, 'Lord and Lady of Mictlan.'], ['Vucub Caquix', 'Zipacna', 'family', 70, 2, 'Father and son.'], ['Zipacna', 'Cabrakan', 'family', 75, 5, 'Brothers.'],
      ['Manco Capac', 'Mama Huaco', 'family', 60, 2, 'Brother and sister.'], ['Ollantay', 'Cusi Coyllur', 'partners', 90, 0, 'Ten years apart. Still together.'], ['El Cadejo Blanco', 'El Cadejo Negro', 'rivalry', -70, 6, 'One walks you home. The other does not.'], ['El Dorado', 'El Charro Negro', 'dislike', -50, -2, 'Both of them promise gold.']],
    rows: `
Quetzalcoatl|M|F|H|33|84|82|92|80|Morning Star|sq=92 fl=90 lr=leader
Tezcatlipoca|M|H|E|36|82|76|92|90|Smoking Mirror|sq=90 te=80 pk=27-37 cl=42
Huitzilopochtli|M|F|S|28|80|80|86|70|Xiuhcoatl|dur=88
El Charro Negro|M|H|E|40|78|66|90|90|Bolsa de Oro|pk=31-41 cl=46
Mictlantecuhtli|M|H|P|44|76|64|84|72|Ninth Level|dur=92 pk=35-45 cl=49
Camazotz|M|H|H|30|76|80|80|40|House of Bats|fl=92
Hunahpu|M|F|H|22|74|80|84|72|Blowgun Shot|pot=88 mgr=Xmucane
Xbalanque|M|F|H|22|74|82|82|70|Jaguar Sun|pot=88 mgr=Xmucane
Naylamp|M|F|T|45|72|72|80|78|Balsa Fleet|lr=mentor pk=36-46 cl=50
Ollantay|M|F|E|30|72|66|90|76|Ollantaytambo|sq=88
El Dorado|M|T|E|29|72|58|92|84|Lake Guatavita|lr=diva mgr=Pedro Urdemales
El Mohan|M|H|B|38|70|68|78|66|Magdalena Whirlpool|hc=80 pk=29-39 cl=44
Xolotl|M|T|B|33|70|72|76|58|Evening Star
Manco Capac|M|F|A|34|68|74|78|74|Golden Staff
Vucub Caquix|M|H|E|38|68|56|88|92|False Sun|lr=diva pk=29-39 cl=44
Hun-Came|M|H|T|40|66|70|70|76|Dark House|pk=31-41 cl=46
El Sombreron|M|H|E|34|66|60|84|82|Midnight Serenade
Huehuecoyotl|M|T|E|45|66|54|86|90|Old Coyote's Song|pk=36-46 cl=50
Juan Oso|M|F|P|27|64|66|72|62|Cave Boulder|dur=90
Vucub-Came|M|H|B|40|64|66|68|70|House of Knives|pk=31-41 cl=46
Zipacna|M|H|P|32|64|62|64|50|Four Hundred Boys|dur=92
Xochipilli|M|F|E|24|64|62|88|76|Prince of Flowers|pot=84
El Chupacabra|M|H|B|22|62|64|70|15|Canovanas Night|pot=84
Cabrakan|M|H|P|30|62|60|62|48|Leveller of Mountains
Nanahuatzin|M|F|H|21|60|74|74|60|Leap into the Fire|pot=90
El Cadejo Blanco|M|F|H|30|60|70|70|30|Safe Road Home
El Cadejo Negro|M|H|B|30|60|68|66|30|Chains at Midnight
El Silbon|M|H|S|26|58|66|68|40|Bag of Bones
Boto Encantado|M|T|E|25|58|62|86|78|Back to the River|pot=80
Curupira|M|F|H|20|50|70|70|58|Backward Tracks|pot=86
La Catrina|F|F|E|32|80|60|95|90|Calavera Garbancera|sq=92
Coyolxauhqui|F|H|S|30|78|76|84|76|Golden Bells
Mictecacihuatl|F|H|E|38|74|60|86|80|Keeper of the Bones|pk=29-39 cl=44
Itzpapalotl|F|H|H|26|70|76|78|60|Obsidian Wings|fl=90
Xochiquetzal|F|F|E|23|70|62|90|74|Tamoanchan|pot=82
Coatlicue|F|T|P|44|66|62|78|70|Serpent Skirt|dur=90 lr=mentor pk=35-45 cl=49
Cusi Coyllur|F|F|T|34|66|72|74|68|Joyful Star|safe=90
La Siguanaba|F|H|E|33|64|58|80|72|The Unveiling
Mama Huaco|F|T|B|30|64|70|70|62|Haybinto
Xquic|F|F|A|36|62|68|74|66|Calabash Tree|pk=27-37 cl=42
La Lechuza|F|H|H|29|60|70|68|56|Night Whistle|fl=88
La Pincoya|F|F|H|21|56|70|80|58|Facing the Sea|pot=86
Pedro Urdemales|M|H|E|35|60|20|80|92||roles=manager br=20 te=25 fl=15 st=30
Xmucane|F|F|E|45|58|20|74|80||roles=manager br=10 te=20 fl=10 st=20` },

  // ---------------------------------------------------------------------------------------------------------------
  // LTA: the traditionalists. An older, safer, steadier roster; dynasties, mentors and six established teams.
  { id: 'lta', name: 'LTA', full_name: 'Lucha Tradicional de las Americas', blurb: 'The oldest company in the world. Liberators, emperors and their heirs, wrestling clean and waiting their turn.',
    owner: { name: 'Nezahualcoyotl', style: 'heroes', roots: 'tradition', pledge: 'stable' }, staff: { road_agent: 'Tlahuicole', head_writer: 'Andres Bello' }, announcers: ['Bernal Diaz del Castillo', 'Miguel de Cervantes'],
    cities: ['Mexico City', 'Puebla', 'Guadalajara', 'Veracruz', 'Havana', 'Caracas', 'Bogota', 'Quito', 'Lima', 'Santiago', 'Buenos Aires', 'Madrid'],
    shows: [['fri', 'Viernes Tradicional', 1]],
    titles: [['lta_world', 'Corona de las Americas World Title', 'M', 3, 0, ['Simon Bolivar']], ['lta_condor', 'Golden Condor Title', 'M', 2, 0, ['Atahualpa']], ['lta_national', 'Anahuac National Title', 'M', 1, 0, ['Cuauhtemoc']], ['lta_women', "Libertadora Women's Title", 'F', 3, 0, ['Manuela Saenz']], ['lta_tag', 'Twin Volcanoes Tag Titles', 'M', 2, 1, ['Jose de San Martin', "Bernardo O'Higgins"]]],
    teams: [['Army of the Andes', 'Jose de San Martin', "Bernardo O'Higgins", 90, 6], ['Los Conquistadores', 'Hernan Cortes', 'Pedro de Alvarado', 85, 4], ['Norte y Sur', 'Pancho Villa', 'Emiliano Zapata', 60, 5], ['Los Mambises', 'Jose Marti', 'Antonio Maceo', 75, 4], ['La Araucana', 'Caupolican', 'Lautaro', 70, 6], ['Las Insurgentes', 'Leona Vicario', 'Policarpa Salavarrieta', 40, 4]],
    stables: [['La Conquista', 'Hernan Cortes', ['Hernan Cortes', 'Francisco Pizarro', 'Pedro de Alvarado', 'Pedro de Valdivia']], ['House of Moctezuma', 'Moctezuma II', ['Moctezuma II', 'Cuitlahuac', 'Cuauhtemoc']]],
    rels: [['Moctezuma II', 'Cuitlahuac', 'family', 70, 3, 'Brothers.'], ['Moctezuma II', 'Isabel Moctezuma', 'family', 85, 0, 'Father and daughter.'], ['Cuitlahuac', 'Cuauhtemoc', 'family', 75, 5, 'Cousins. The crown passed from one to the other.'], ['Cuauhtemoc', 'Isabel Moctezuma', 'family', 70, 0, 'Husband and wife.'],
      ['Atahualpa', 'Huascar', 'family', -85, 7, 'Half-brothers. One throne.'], ['Pachacuti', 'Atahualpa', 'family', 40, 3, 'Great-grandfather and heir.'], ['Tupac Amaru II', 'Micaela Bastidas', 'family', 90, 0, 'Husband and wife.'],
      ['Simon Rodriguez', 'Simon Bolivar', 'mentor', 90, 0, 'His old tutor.'], ['Simon Bolivar', 'Antonio Jose de Sucre', 'mentor', 85, 6, ''], ['Benito Juarez', 'Ignacio Zaragoza', 'mentor', 70, 4, ''], ['Caupolican', 'Lautaro', 'mentor', 75, 5, ''], ['Porfirio Diaz', 'Victoriano Huerta', 'mentor', 50, 3, 'His old general.'],
      ['Simon Bolivar', 'Manuela Saenz', 'partners', 85, 0, 'She saved his life one September night.'], ['Simon Bolivar', 'Jose de San Martin', 'friendship', 30, 7, 'They met once, at Guayaquil. Neither said what was agreed.'],
      ['Vicente Guerrero', 'Agustin de Iturbide', 'rivalry', -45, 5, 'They embraced at Acatempan. It did not last.'], ['Pedro de Valdivia', 'Lautaro', 'rivalry', -80, 6, 'Lautaro was his groom before he was his end.'], ['Benito Juarez', 'Porfirio Diaz', 'rivalry', -60, 5, 'Both from Oaxaca. The pupil turned on the teacher.'], ['Hernan Cortes', 'Moctezuma II', 'rivalry', -85, 7, ''], ['Francisco Pizarro', 'Atahualpa', 'rivalry', -90, 6, '']],
    rows: `
Simon Bolivar|M|F|A|42|82|82|92|92|Admirable Campaign|sq=92 lr=leader pk=33-43 cl=47 mgr=Simon Rodriguez
Pancho Villa|M|T|B|42|80|74|92|80|Division del Norte|hc=80 dur=88 pk=33-43 cl=47
Hernan Cortes|M|H|A|38|80|78|84|84|Scuttled Ships|pk=29-39 cl=44 mgr=Charles V
Benito Juarez|M|F|T|46|78|80|78|82|Respeto al Derecho Ajeno|cons=94 safe=92 lr=mentor pk=37-47 cl=51
Jose de San Martin|M|F|T|42|78|84|78|72|Crossing the Andes|cons=92 safe=90 pk=33-43 cl=47
Moctezuma II|M|T|A|45|76|66|88|84|Quetzal Crown|lr=leader pk=36-46 cl=50
Emiliano Zapata|M|F|S|39|76|78|86|74|Plan de Ayala|cons=88 pk=30-40 cl=45
Francisco Pizarro|M|H|B|46|74|68|74|70|Line in the Sand|pk=37-47 cl=51 mgr=Charles V
Atahualpa|M|H|A|32|74|74|82|76|Ransom Room
Porfirio Diaz|M|H|B|46|74|68|78|76|Pan o Palo|dur=88 lr=gatekeeper pk=37-47 cl=51
Toussaint Louverture|M|F|T|46|72|82|82|84|The Opening|cons=90 lr=mentor pk=37-47 cl=51
Cuauhtemoc|M|F|A|24|72|80|80|64|Descending Eagle|pot=90
Santa Anna|M|H|E|45|70|56|86|88|Eleven Presidencies|cons=40 lr=diva pk=36-46 cl=50
Tupac Amaru II|M|T|B|42|70|72|80|78|Tinta Uprising|pk=33-43 cl=47
Pachacuti|M|H|A|45|68|70|80|72|Cusco Reborn|dur=86 pk=36-46 cl=50
Jose Marti|M|F|T|42|68|62|88|97|Rosa Blanca|pk=33-43 cl=47
Antonio Maceo|M|F|B|44|66|74|76|66|Baragua Protest|dur=96 cons=88 pk=35-45 cl=49
Pedro de Alvarado|M|H|A|36|66|72|74|64|Alvarado's Leap|fl=78 pk=27-37 cl=42
Antonio Jose de Sucre|M|F|T|33|66|80|70|64|Ayacucho|cons=90 safe=90
Vicente Guerrero|M|F|B|43|66|70|74|72|La Patria Es Primero|cons=86 pk=34-44 cl=48
Agustin de Iturbide|M|H|A|40|64|70|76|74|Three Guarantees|pk=31-41 cl=46
Huascar|M|T|T|35|64|72|68|62|Golden Chain|safe=88
Caupolican|M|F|P|38|64|68|70|56|Toqui's Log|dur=94 st=92 pk=29-39 cl=44
Bernardo O'Higgins|M|F|B|40|64|72|70|66|Rancagua Breakout|pk=31-41 cl=46
Pedro de Valdivia|M|H|B|44|62|68|70|66|Nueva Extremadura|pk=35-45 cl=49
Ignacio Zaragoza|M|F|T|32|62|74|66|62|Cinco de Mayo|cons=86
Lope de Aguirre|M|H|B|45|60|62|72|80|Letter to the King|hc=84 cons=40 pk=36-46 cl=50
Cuitlahuac|M|T|B|44|60|68|66|58|Noche Triste|lr=gatekeeper pk=35-45 cl=49
Lautaro|M|F|A|22|58|74|74|60|Tucapel|pot=92
Victoriano Huerta|M|H|B|45|58|62|64|62|Decena Tragica|lr=toxic pk=36-46 cl=50
Juan Manuel de Rosas|M|H|B|45|56|62|72|74|Restorer of the Laws|pk=36-46 cl=50
Manuela Saenz|F|F|A|36|78|78|86|84|September Night|sq=88 pk=27-37 cl=42
Juana Azurduy|F|F|B|38|74|76|80|72|Los Leales|dur=88 lr=leader pk=29-39 cl=44
Malintzin|F|T|T|30|72|74|82|95|Three Tongues
Leona Vicario|F|F|T|34|68|74|76|80|Secret Courier|cons=88 safe=90
La Quintrala|F|H|B|40|66|64|78|74|Quintral Vine|hc=82 pk=31-41 cl=46
Micaela Bastidas|F|F|A|36|64|72|72|76|March on Cusco|pk=27-37 cl=42
Ines de Suarez|F|H|B|42|64|68|72|68|Defence of Santiago|pk=33-43 cl=47
La Perricholi|F|H|E|30|62|48|88|86|Viceroy's Carriage|lr=diva
Agustina de Aragon|F|F|B|32|62|68|74|62|Portillo Cannon
Isabel Moctezuma|F|F|T|21|58|68|76|66|Tecuichpoch|pot=88
Policarpa Salavarrieta|F|F|H|21|52|68|76|74|Seamstress's Needle|pot=90
Simon Rodriguez|M|F|E|46|58|20|72|88||roles=manager br=15 te=25 fl=10 st=25
Charles V|M|H|E|45|66|20|80|82||roles=manager br=20 te=20 fl=10 st=20` },

  // ---------------------------------------------------------------------------------------------------------------
  // KJP: all women. Elite work rate, stiff strikes, four factions that cover most of the locker room.
  { id: 'kjp', name: 'KJP', full_name: 'Kaguya Joshi Pro', blurb: 'All women, all speed. Four factions, stiff strikes and a merchandise table longer than the ring.',
    owner: { name: 'Izumo no Okuni', style: 'merit', roots: 'tradition', pledge: 'chance' }, staff: { road_agent: 'Chiba Sana', head_writer: 'Murasaki Shikibu' }, announcers: ['Sei Shonagon', 'Lafcadio Hearn'],
    cities: ['Kyoto', 'Nara', 'Edo', 'Osaka', 'Kamakura', 'Izumo', 'Ise', 'Aizu', 'Sendai', 'Hakata', 'Nikko', 'Kanazawa'],
    shows: [['sun', 'Sunday Moonrise', 1]],
    titles: [['kjp_world', 'Bamboo Moon World Title', 'F', 3, 0, ['Kaguya-hime']], ['kjp_camellia', 'Crimson Camellia Title', 'F', 2, 0, ['Hangaku Gozen']], ['kjp_speed', 'Swift Feather High Speed Title', 'F', 1, 0, ['The Crane Wife']], ['kjp_tag', 'Twin Blossom Tag Titles', 'F', 2, 1, ['Tachibana Ginchiyo', 'Ii Naotora']]],
    teams: [['Setsugekka', 'Oichi', 'Ono no Komachi', 70, 6], ['Helmet and Scarf', 'Yaegaki-hime', 'Matsura Sayohime', 60, -2], ['The Castle Lords', 'Tachibana Ginchiyo', 'Ii Naotora', 75, 5], ['Kaidan', 'Oiwa', 'Okiku', 65, 4], ['Tide and Jewel', 'Otohime', 'Tamatori-hime', 70, 5]],
    stables: [['Kacho Fugetsu', 'Oichi', ['Oichi', 'Ono no Komachi', 'Yaegaki-hime', 'Matsura Sayohime', 'Tamatori-hime']], ['The Joshitai', 'Hangaku Gozen', ['Hangaku Gozen', 'Nakano Takeko', 'Kaihime', 'Tachibana Ginchiyo', 'Ii Naotora', 'Komatsuhime']],
      ['Hyakki Yagyo', 'Tamamo-no-Mae', ['Tamamo-no-Mae', 'Yuki-onna', 'Jorogumo', 'Kiyohime', 'Yamauba']], ['Hour of the Ox', 'Kijo Momiji', ['Kijo Momiji', 'Oiwa', 'Okiku', 'Takiyasha-hime', 'Lady Rokujo']]],
    rels: [['Kaguya-hime', 'Tamamo-no-Mae', 'rivalry', -80, 9, 'The moon and the fox.'], ['Oichi', 'Kijo Momiji', 'rivalry', -75, 7, 'The beauty of the age and the demon of the maples.'], ['Oichi', 'Ono no Komachi', 'friendship', 85, 6, 'Two famous beauties who somehow get along.'], ['Oichi', 'Yodo-dono', 'family', 70, 3, 'Mother and daughter.'],
      ['Yaegaki-hime', 'Matsura Sayohime', 'friendship', 30, -2, 'One crossed the ice for him. One waited on the hill. They argue about it.'], ['Otohime', 'Tamatori-hime', 'friendship', 80, 5, 'She once stole a jewel from the Dragon Palace. Otohime let it go.'], ['Hangaku Gozen', 'Nakano Takeko', 'mentor', 80, 6, 'Seven centuries apart, the same weapon.'],
      ['Yamauba', 'Kiyohime', 'mentor', 60, 3, ''], ['Oiwa', 'Okiku', 'friendship', 70, 4, 'They compare grievances.'], ['Hojo Masako', 'Shizuka Gozen', 'friendship', 45, 3, 'She spoke up for the dancer at Tsurugaoka.'],
      ['Kuzunoha', 'Tamamo-no-Mae', 'dislike', -55, 4, 'Two foxes, two reputations.'], ['Abe no Yasuna', 'Kuzunoha', 'family', 90, 0, 'Husband and wife. He saved her from the hunters.']],
    rows: `
Oichi|F|F|S|30|80|88|92|76|Tied at Both Ends|sq=94 lr=leader
Kaguya-hime|F|F|H|24|78|90|92|74|Five Impossible Tasks|sq=92 fl=94 st=92
Tamamo-no-Mae|F|H|T|29|78|88|90|88|Killing Stone|sq=88
Hangaku Gozen|F|T|S|31|76|90|78|62|Torisaka Volley|cons=92 lr=gatekeeper
Kijo Momiji|F|H|S|33|74|84|84|78|Maple Viewing|br=90
Yuki-onna|F|H|T|26|72|88|82|60|White Breath|dur=56
Yodo-dono|F|T|A|33|72|82|84|80|Winter Siege|st=90
Hojo Masako|F|H|T|38|70|78|82|95|Jokyu Address|pk=29-39 cl=44 mgr=Kasuga no Tsubone
Kiyohime|F|H|S|22|70|84|78|64|Dojoji Bell|pot=86 dur=58
Nakano Takeko|F|F|S|21|68|88|80|66|Aizu Charge|br=92 pot=92 dur=54
Ono no Komachi|F|F|H|25|68|80|94|84|Hundred Nights|fl=84
Otohime|F|F|T|27|66|82|84|70|Tamatebako
Tachibana Ginchiyo|F|F|T|25|66|86|72|66|Musket Line|cons=86
Himiko|F|T|T|35|66|74|88|82|Hundred Bronze Mirrors
Oiwa|F|H|S|30|64|80|78|58|Lantern Ghost|hc=78 dur=60
Shizuka Gozen|F|F|H|23|64|82|88|70|Dance at Tsurugaoka|fl=86 dur=58
Ii Naotora|F|T|T|32|62|84|70|68|Iinoya|cons=88
The Crane Wife|F|F|H|24|62|90|76|48|Feather Loom|fl=95 dur=50
Jorogumo|F|H|T|28|62|86|76|64|Joren Falls|te=92
Kaihime|F|F|S|23|60|84|72|60|Oshi Flood Wall|pot=84
Takiyasha-hime|F|H|S|24|60|80|80|72|Giant Skeleton
Tamatori-hime|F|F|T|27|58|82|74|60|Jewel Dive
Okiku|F|H|T|20|58|80|72|50|Nine Plates|pot=86 dur=52
Kuzunoha|F|F|H|28|56|80|76|66|Shinoda Forest|mgr=Abe no Yasuna
Yamauba|F|H|B|44|56|72|70|66|Mount Ashigara|dur=90 lr=mentor pk=35-45 cl=49
Yaegaki-hime|F|F|H|19|54|78|86|62|Lake Suwa Crossing|pot=92 dur=48
Lady Rokujo|F|H|T|32|54|74|80|78|Living Spirit
Uriko-hime|F|F|T|20|52|80|78|60|Weaver's Shuttle|pot=88
Matsura Sayohime|F|T|T|26|50|76|58|52|Scarf-Waving Hill|dur=97
Komatsuhime|F|F|S|19|48|76|68|64|Numata Gate|pot=90
Kasuga no Tsubone|F|H|E|45|58|20|74|88||roles=manager br=15 te=20 fl=10 st=25
Abe no Yasuna|M|F|E|40|60|20|80|82||roles=manager br=15 te=25 fl=10 st=25` }
];
