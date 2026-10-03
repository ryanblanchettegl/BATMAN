// Builds universes/public_domain.json: the default universe.
// Every character is a historical figure dead for more than a century, a figure of myth or folklore,
// or a character from fiction first published before 1929. Looks and acts come from the original sources.
// Portraits for the marquee names: head, hair, facial hair, mustache, eyes, nose, skin tone 0-100, hair colour 0-100.
// Everybody else gets a stable face derived from their name. Looks follow the original books and the historical record, not any film.
const FACES = {
  'King Arthur': '1,9,4,2,0,8,20,30', 'Abraham Lincoln': '2,3,3,0,8,3,22,54', 'Dracula': '6,4,0,0,5,5,4,54', 'Julius Caesar': '1,2,0,0,3,8,28,45',
  'Cleopatra': '0,9,0,0,4,2,44,54', 'Sherlock Holmes': '6,3,0,0,1,5,14,45', 'The Monster': '2,9,0,0,8,9,6,54', 'Sun Tzu': '3,4,2,8,1,7,30,54',
  'Robin Hood': '0,8,2,1,7,0,18,30', 'Merlin': '2,9,5,9,6,3,16,73', 'Captain Ahab': '5,2,3,0,5,6,26,64', 'George Washington': '1,4,0,0,0,8,14,73',
  'Theodore Roosevelt': '3,2,0,5,1,1,18,36', 'Mordred': '8,4,1,0,5,2,18,54', 'Sir Lancelot': '1,8,1,0,0,0,20,45', 'Boudica': '4,9,0,0,5,0,10,18',
  'Morgan le Fay': '4,9,0,0,6,2,8,54', 'Don Quixote': '6,1,2,6,9,3,24,64', 'Hercules': '5,7,4,2,3,1,34,45', 'Professor Moriarty': '6,0,0,0,8,3,10,64',
  'Long John Silver': '7,8,9,9,5,1,30,36', 'Napoleon Bonaparte': '3,3,0,0,5,8,16,45', 'Genghis Khan': '7,4,2,8,1,9,36,54', 'Leonardo da Vinci': '2,9,5,9,6,3,20,64',
  'Captain Nemo': '0,4,4,2,8,0,46,54', 'Jean Valjean': '5,1,4,2,3,1,24,64', 'Inspector Javert': '1,3,6,0,5,3,18,45', 'The Count of Monte Cristo': '0,4,2,1,8,0,12,54',
  'Mark Antony': '1,7,0,0,0,8,30,45', 'Guinevere': '0,9,0,0,4,2,12,9', 'Irene Adler': '4,7,0,0,7,7,14,45', 'Lady Macbeth': '8,9,0,0,5,2,8,18',
  // the top three of each newer promotion, drawn from the historical record or the original stories
  'Arsene Lupin': '4,4,0,1,4,0,14,54', 'Professor Challenger': '9,7,4,0,3,1,22,54', 'Ayesha': '0,9,0,0,4,2,14,54',
  'Quetzalcoatl': '2,9,4,0,7,5,58,54', 'Tezcatlipoca': '5,9,0,0,5,5,62,54', 'Huitzilopochtli': '9,5,0,0,3,1,58,91',
  'Simon Bolivar': '6,7,6,0,4,8,36,54', 'Pancho Villa': '3,3,0,9,6,1,48,54', 'Hernan Cortes': '6,3,4,2,8,8,22,36',
  'Oichi': '4,9,0,0,1,4,12,54', 'Kaguya-hime': '0,9,0,0,7,7,6,54', 'Tamamo-no-Mae': '8,9,0,0,1,2,10,18',
  'Joan of Arc': '0,2,0,0,7,0,14,36', 'Zeus': '5,9,5,9,3,8,24,73', 'Achilles': '1,9,0,0,5,0,26,9', 'Odin': '5,9,5,9,8,3,14,64', 'Thor': '9,9,4,9,3,1,14,18'
};
// Row: Name | Gender | Side (F face, H heel, T tweener) | Style | Age | Overness | Work rate | Charisma | Promo | Finisher | extras
// Styles: B brawler, T technician, H flyer, P powerhouse, A all-rounder, S striker, E entertainer.
// Extras: br= te= fl= st= hc= dur= safe= sq= cons= pot= mor=  roles=manager,road_agent  mgr=Name  pk=27-35  cl=40
const fs = require('fs'), path = require('path');
const STYLE = { B: [6, -12, -10, 0], T: [-8, 8, -6, 2], H: [-14, -6, 10, 3], P: [8, -14, -16, -8], A: [0, 0, -2, 0], S: [4, 0, -4, 0], E: [0, -6, -6, -4] };
const STYLE_NAME = { B: 'brawler', T: 'technician', H: 'flyer', P: 'powerhouse', A: 'all_rounder', S: 'striker', E: 'entertainer' };
const slug = s => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '').slice(0, 40);
const clamp = (v, a, b) => Math.max(a, Math.min(b, Math.round(v)));

const PROMOS = [
  { id: 'whw', name: 'WHW', full_name: 'World History Wrestling', blurb: 'The giant. Publicly traded, family friendly, and run for the shareholders. Emperors and presidents in sold-out stadiums.', model: 'corporate', popularity: 88, cash: 110e6, work_rate_weight: 0.34, angles_per_show: 2, wage_scale: 2.0, tv_rate: 4200, production_cost: 620000, target_weekly_net: 1500000, flagship_month: 12, production_level: 4, risk_level: 1, tv_slot: 2,
    owner: { name: 'P. T. Barnum', style: 'stars', roots: 'family', pledge: 'pay' }, staff: { road_agent: 'Milo of Croton', head_writer: 'Plutarch' }, announcers: ['Herodotus', 'Samuel Pepys'],
    cities: ['Rome', 'Athens', 'Alexandria', 'Constantinople', 'London', 'Paris', 'Vienna', 'Kyoto', 'Philadelphia', 'Boston', 'Chicago', 'St. Louis'],
    shows: [['mon', 'Monday Night Dynasty', 1], ['thu', 'Thursday Chronicle', 0.7]],
    titles: [['whw_world', 'Imperial World Title', 'M', 3, 0, ['Alexander the Great']], ['whw_iron', 'Iron Crown Title', 'M', 2, 0, ['Miyamoto Musashi']], ['whw_tv', 'Magna Carta Television Title', 'M', 1, 0, ['William Wallace']], ['whw_women', 'Empress Title', 'F', 3, 0, ['Elizabeth I']], ['whw_tag', 'Twin Eagles Tag Titles', 'M', 2, 1, ['Ragnar Lothbrok', 'Harald Hardrada']]],
    teams: [['The Northmen', 'Ragnar Lothbrok', 'Harald Hardrada', 80, 5], ['The Academy', 'Plato', 'Aristotle', 70, 4], ['The Jolly Rogers', 'Anne Bonny', 'Mary Read', 85, 6], ['Wellington and Nelson', 'The Duke of Wellington', 'Horatio Nelson', 55, 2], ['The Caesars', 'Augustus', 'Nero', 40, -2]],
    stables: [['The Princes', 'Henry VIII', ['Henry VIII', 'Ivan the Terrible', 'Louis XIV', 'Robespierre']]],
    rows: `
Alexander the Great|M|F|A|30|97|88|96|86|Gordian Knot|sq=98 pk=26-34
Napoleon Bonaparte|M|H|T|35|95|84|94|95|Austerlitz|sq=96
Genghis Khan|M|H|B|40|94|80|92|78|Golden Horde|dur=90
George Washington|M|F|P|39|93|78|94|84|Delaware Crossing|safe=88 lr=leader
Theodore Roosevelt|M|F|B|38|90|82|95|96|Big Stick|dur=92 cons=88 lr=leader
Leonidas|M|F|B|37|88|84|90|82|Hot Gates|hc=84
Richard the Lionheart|M|F|B|33|88|82|86|74|Lion's Roar
Saladin|M|F|T|36|87|88|86|80|Hattin Hold|safe=90
Hannibal|M|H|P|38|86|80|82|76|Over the Alps
Spartacus|M|F|S|31|86|86|88|78|Chainbreaker|hc=88
Miyamoto Musashi|M|T|T|34|85|95|78|60|Five Rings|cons=96 safe=92 lr=gatekeeper
The Duke of Wellington|M|F|T|40|84|82|78|80|Waterloo
Milo of Croton|M|F|P|36|84|90|70|40|Bull Carry|dur=95 te=92 lr=mentor
Attila|M|H|B|36|84|76|82|64|Scourge
Henry VIII|M|H|P|42|84|62|88|90|Tudor Rose Bomb
Shaka Zulu|M|F|S|33|82|84|84|74|Horns of the Buffalo
William Wallace|M|F|B|32|82|78|86|84|Stirling Bridge
Ivan the Terrible|M|H|B|41|82|70|84|76|Iron Staff
Blackbeard|M|H|B|40|80|66|88|82|Queen Anne's Revenge|hc=86
Vlad the Impaler|M|H|B|38|80|72|82|68|Night Attack|hc=90
Ramses the Great|M|H|E|44|80|60|90|88|Kadesh
Charlemagne|M|F|P|43|80|70|82|74|Iron Crown
Ragnar Lothbrok|M|H|B|37|78|74|82|76|Snake Pit
El Cid|M|F|A|36|78|80|80|70|Campeador
William the Conqueror|M|H|B|39|78|72|78|72|Ten Sixty-Six
Horatio Nelson|M|F|H|39|78|76|80|76|Trafalgar
Louis XIV|M|H|E|40|78|50|92|92|Sun King Splash|lr=diva
Rasputin|M|H|P|45|76|58|88|82|Won't Stay Down|dur=99
Peter the Great|M|F|P|35|76|68|78|70|Window on the West
Augustus|M|H|T|30|76|76|78|80|Pax Romana
Nero|M|H|E|28|74|58|80|86|The Fiddle
Sir Francis Drake|M|H|H|38|74|74|76|72|Golden Hind
Frederick the Great|M|H|T|41|74|78|70|74|Oblique Order
Robespierre|M|H|T|34|72|66|70|90|The Guillotine|lr=toxic
Plato|M|F|P|38|72|78|74|88|The Cave|te=80
Ulysses S. Grant|M|F|B|42|72|68|70|62|Unconditional Surrender
Harald Hardrada|M|H|P|41|70|66|70|60|Last Viking
Leif Erikson|M|F|P|33|70|70|72|62|Vinland
Wolfgang Amadeus Mozart|M|F|E|25|70|60|90|80|Requiem|pot=80
Ludwig van Beethoven|M|H|B|38|70|64|78|58|Fifth Symphony
Lord Byron|M|H|E|30|70|58|92|90|Mad, Bad and Dangerous
Leonardo da Vinci|M|F|A|40|70|74|80|76|Vitruvian Lock
Isaac Newton|M|H|T|42|66|68|62|70|Third Law
Socrates|M|F|T|45|66|62|78|95|Socratic Method|lr=mentor
Marco Polo|M|F|H|28|66|72|74|78|Silk Road
Aristotle|M|T|T|35|64|72|66|84|Golden Mean
Tutankhamun|M|F|H|19|64|66|80|60|Boy King|pot=90 sq=88
Hammurabi|M|F|T|45|62|64|68|76|Eye for an Eye
Archimedes|M|F|T|44|58|66|60|70|The Lever
Charles Darwin|M|F|T|44|56|62|58|72|Natural Selection
Galileo Galilei|M|F|T|45|54|58|60|74|And Yet It Moves
Elizabeth I|F|F|E|36|90|66|94|95|The Armada|sq=95
Catherine the Great|F|H|P|38|88|72|90|88|Enlightened Despot
Wu Zetian|F|H|T|40|84|76|84|82|Mandate of Heaven
Tomoe Gozen|F|F|S|27|84|92|78|56|Naginata Sweep|cons=92
Hua Mulan|F|F|H|22|82|86|84|66|Twelve Years|pot=94
Nefertiti|F|H|E|30|80|60|94|82|Beautiful One
Marie Antoinette|F|H|E|26|78|52|90|86|Let Them Eat Canvas|lr=diva
Queen Victoria|F|H|P|44|76|58|80|84|We Are Not Amused
Zenobia|F|F|B|31|76|74|78|72|Palmyra
Hatshepsut|F|F|A|38|74|70|78|74|Punt Expedition
Grace O'Malley|F|H|B|35|74|70|78|76|Pirate Queen
Anne Bonny|F|H|B|24|72|70|78|70|No Quarter|hc=80
Lucrezia Borgia|F|H|T|28|72|68|84|80|Poisoned Chalice
Eleanor of Aquitaine|F|H|E|42|72|56|84|88|Court of Love
Mary Read|F|H|S|26|70|72|72|64|Cutlass Swing
Mary, Queen of Scots|F|F|T|29|70|68|80|74|Holyrood
Artemisia of Caria|F|F|B|34|68|70|70|66|Salamis
Lady Godiva|F|F|H|27|64|66|82|62|Coventry Ride
Florence Nightingale|F|F|T|30|62|70|72|70|Bedside Manner|safe=97
Ada Lovelace|F|F|T|24|60|68|70|74|Analytical Engine|pot=86
Niccolo Machiavelli|M|H|E|45|66|30|78|94||roles=manager br=20 te=30 fl=15 st=30` },
  { id: 'pdw', name: 'PDW', full_name: 'Public Domain Wrestling', blurb: 'The challenger. Founded by a fan for the fans who rate matches: history, myth and old fiction in one locker room.', model: 'workrate', popularity: 72, cash: 32e6, work_rate_weight: 0.62, angles_per_show: 2, wage_scale: 1.4, tv_rate: 3000, production_cost: 380000, target_weekly_net: 120000, flagship_month: 3, production_level: 3, risk_level: 2, tv_slot: 2,
    owner: { name: 'William Shakespeare', style: 'merit', roots: 'rebellion', pledge: 'pay' }, staff: { road_agent: 'Sun Tzu', head_writer: 'Alexandre Dumas' }, announcers: ['Charles Dickens', 'Oscar Wilde'],
    cities: ['London', 'Edinburgh', 'Dublin', 'Paris', 'Verona', 'Nottingham', 'Camelot', 'Springfield', 'New York', 'Boston', 'Baltimore', 'New Orleans'],
    shows: [['wed', 'Wednesday Night Folio', 1], ['sat', 'Saturday Serial', 0.6]],
    titles: [['pdw_world', 'Excalibur World Heavyweight Title', 'M', 3, 0, ['King Arthur']], ['pdw_folio', 'First Folio Title', 'M', 2, 0, ['The Count of Monte Cristo']], ['pdw_women', "Valkyrie Women's Championship", 'F', 3, 0, ['Cleopatra']], ['pdw_tag', 'Gemini Tag Team Titles', 'M', 2, 1, ['Romulus', 'Remus']]],
    teams: [['The Founders', 'Romulus', 'Remus', 75, -3], ['Baker Street', 'Sherlock Holmes', 'Dr. John Watson', 85, 6], ['The Knight and the Squire', 'Don Quixote', 'Sancho Panza', 90, 5], ['The Pickpockets', 'The Artful Dodger', 'Oliver Twist', 60, 3], ['The Inseparables', 'Porthos', 'Aramis', 80, 5]],
    stables: [['The Round Table', 'King Arthur', ['King Arthur', 'Sir Lancelot', 'Sir Gawain', 'Sir Galahad']], ['The Triumvirate', 'Julius Caesar', ['Julius Caesar', 'Pompey', 'Crassus']], ['The Art of War', 'Professor Moriarty', ['Professor Moriarty', 'Mordred', 'Inspector Javert', 'Long John Silver']], ['The Merry Men', 'Robin Hood', ['Robin Hood', 'Little John', 'Will Scarlet']]],
    rows: `
King Arthur|M|F|A|36|95|82|92|84|Sword in the Stone|br=82 te=80 fl=55 st=85 mor=85 sq=96 lr=leader mgr=Merlin
Abraham Lincoln|M|F|T|34|91|88|90|96|Rail Splitter|br=74 te=93 fl=48 st=88 mor=90 sq=94 safe=92 cons=90 dur=85 lr=leader
Dracula|M|H|S|40|92|78|95|86|Last Sunset|br=84 te=72 fl=60 st=80 mor=70 sq=95 mgr=Renfield
Julius Caesar|M|H|E|38|90|74|94|93|Crossing the Rubicon|br=76 te=74 fl=40 st=78 mor=72
Sherlock Holmes|M|T|T|35|84|90|80|88|The Final Problem|br=62 te=97 fl=50 st=82 mor=75 cons=94
The Monster|M|H|P|29|83|62|78|25|Modern Prometheus|br=90 te=40 fl=20 st=70 mor=55 dur=96 safe=45 mgr=Dr. Victor Frankenstein
Sir Lancelot|M|F|A|31|84|88|84|66|Lake Effect
Professor Moriarty|M|H|T|42|80|74|78|90|Reichenbach Fall|mgr=Sun Tzu
The Count of Monte Cristo|M|H|A|36|79|78|86|88|The Long Revenge
Robin Hood|M|F|H|28|78|80|82|76|Bullseye|fl=92
Mark Antony|M|F|E|34|77|70|85|92|Lend Me Your Ears
Mordred|M|H|B|27|76|74|70|72|Camlann Cutter|pot=84 lr=toxic
Jean Valjean|M|F|P|42|74|70|74|66|Two Four Six Oh One|dur=92 lr=mentor
Brutus|M|F|A|33|74|76|68|70|The Unkindest Cut
Inspector Javert|M|H|T|43|72|76|66|74|The Law|lr=gatekeeper
Captain Ahab|M|H|B|44|72|66|75|80|White Whale|cons=50
Dorian Gray|M|H|E|25|71|62|90|84|The Portrait|pk=22-45 cl=60 lr=diva
D'Artagnan|M|F|H|24|70|80|76|68|All for One|pot=90
Captain Nemo|M|T|T|39|70|78|70|68|Twenty Thousand Leagues
Long John Silver|M|H|B|45|70|60|80|86|Black Spot
Mr. Darcy|M|F|T|28|70|72|84|70|Pride
Heathcliff|M|H|B|30|68|66|78|60|Wuthering Heights
Don Quixote|M|F|E|45|68|55|82|80|Windmill Tilt|cons=40
Little John|M|F|P|34|68|68|70|62|Quarterstaff
Romulus|M|H|B|27|66|70|68|64|Seven Hills
Sir Gawain|M|F|B|30|66|72|68|60|Green Girdle
Pompey|M|H|P|40|66|64|68|66|The Great One
Athos|M|F|T|34|66|78|70|64|One for All
Porthos|M|F|P|33|66|68|72|70|Baldric Buster
The Scarlet Pimpernel|M|F|H|30|66|78|76|74|They Seek Him Here
Quasimodo|M|F|P|26|66|64|62|30|Sanctuary
Remus|M|F|B|27|64|70|66|62|Over the Wall
Sir Galahad|M|F|H|23|64|76|72|58|Siege Perilous|pot=92 sq=85
Ivanhoe|M|F|A|29|64|76|66|58|Disinherited
Aramis|M|F|S|31|64|74|72|72|Fleur-de-Lis Thrust
Dr. John Watson|M|F|B|37|62|68|60|64|Service Revolver|safe=90 lr=gatekeeper
Crassus|M|H|E|42|62|56|70|78|Richest Man in Rome
Allan Quatermain|M|F|B|43|62|66|66|62|King Solomon's Mine
Phileas Fogg|M|F|A|38|60|70|66|68|Eighty Days|cons=95
Bill Sikes|M|H|B|35|60|58|62|50|Jacob's Island
Sydney Carton|M|F|A|32|60|72|70|76|Far, Far Better
Will Scarlet|M|F|H|25|58|72|66|60|Lincoln Green
Lemuel Gulliver|M|F|P|36|58|60|62|66|Brobdingnag Bomb
Robinson Crusoe|M|F|B|38|56|62|58|54|Castaway
The Artful Dodger|M|H|H|20|52|70|74|76|Pocket Pick|pot=82
Sancho Panza|M|F|B|41|48|52|66|72|Barataria
Oliver Twist|M|F|H|19|45|62|70|48|Please, Sir|pot=84
Cleopatra|F|H|E|29|88|66|96|90|The Asp|br=55 te=70 fl=62 st=74 mor=78 sq=96 lr=diva
Boudica|F|F|B|33|82|76|84|72|Iceni Uprising|br=90 te=62 fl=55 st=86 mor=88
Morgan le Fay|F|H|S|35|78|74|88|84|Avalon's Curse
Lady Macbeth|F|H|E|34|76|64|88|92|Out, Damned Spot
Irene Adler|F|H|T|30|74|78|86|84|A Scandal in Bohemia
Milady de Winter|F|H|S|29|72|72|86|82|The Brand
Guinevere|F|F|A|28|70|70|84|72|Queen's Favour
Mina Harker|F|F|T|27|70|76|72|68|Stake Driver
The Queen of Hearts|F|H|P|40|70|58|82|86|Off With Her Head
Scheherazade|F|F|E|27|68|62|88|94|Thousand and One
Elizabeth Bennet|F|F|T|24|68|74|80|86|Universally Acknowledged
Maid Marian|F|F|H|26|66|72|76|68|Sherwood Shot
Juliet Capulet|F|F|H|20|64|72|80|66|Balcony Dive|pot=86
Lucy Westenra|F|H|H|23|62|70|74|58|Bloofer Lady
Becky Sharp|F|H|E|26|62|60|80|84|Vanity Fair
Jane Eyre|F|F|T|25|60|74|66|70|Thornfield
Alice|F|F|H|19|60|70|76|68|Looking Glass|pot=88
Jo March|F|F|B|22|58|66|70|72|Little Woman
Estella|F|H|T|22|58|68|78|66|Great Expectations|mgr=Miss Havisham
Hester Prynne|F|F|P|30|56|62|64|58|Scarlet Letter
Dr. Victor Frankenstein|M|H|E|33|70|25|70|90||roles=manager br=20 te=25 fl=10 st=30 mor=60
Sun Tzu|M|H|T|45|72|50|75|85||roles=manager,road_agent br=30 te=60 fl=20 st=40 mor=80
Renfield|M|H|E|38|50|30|62|72||roles=manager br=30 te=25 fl=30 st=40
Merlin|M|F|E|45|74|25|88|90||roles=manager br=15 te=30 fl=10 st=30
Uriah Heep|M|H|E|35|54|25|66|84||roles=manager br=20 te=25 fl=15 st=30
Miss Havisham|F|H|E|45|56|20|74|82||roles=manager br=15 te=20 fl=10 st=25` },
  { id: 'ocw', name: 'OCW', full_name: 'Olympus Championship Wrestling', blurb: 'Wrestling as sport. Gods and heroes, long matches, tournaments and clean results.', model: 'purist', popularity: 60, cash: 9e6, work_rate_weight: 0.68, angles_per_show: 1, wage_scale: 0.75, tv_rate: 900, production_cost: 110000, target_weekly_net: 35000, flagship_month: 12, production_level: 2, risk_level: 1, tv_slot: 1,
    owner: { name: 'Homer', style: 'merit', roots: 'tradition', pledge: 'stable' }, staff: { road_agent: 'Chiron', head_writer: 'Hesiod' }, announcers: ['Aesop', 'Ovid'],
    cities: ['Athens', 'Sparta', 'Thebes', 'Corinth', 'Delphi', 'Troy', 'Memphis', 'Uppsala', 'Uruk', 'Tara'],
    shows: [['sat', 'Saturday on Olympus', 1]],
    titles: [['ocw_world', 'Olympian World Title', 'M', 3, 0, ['Zeus']], ['ocw_fleece', 'Golden Fleece Title', 'M', 2, 0, ['Odysseus']], ['ocw_women', 'Amazon Crown', 'F', 3, 0, ['Athena']], ['ocw_tag', 'Argonaut Tag Titles', 'M', 2, 1, ['Gilgamesh', 'Enkidu']]],
    teams: [['Uruk', 'Gilgamesh', 'Enkidu', 90, 7], ['Sons of Asgard', 'Thor', 'Tyr', 60, 3], ['The Labyrinth', 'The Minotaur', 'Polyphemus', 45, 0], ['The Nile', 'Anubis', 'Sobek', 65, 2], ['Brothers of Troy', 'Hector', 'Paris', 70, 1]],
    stables: [['The Olympians', 'Zeus', ['Zeus', 'Poseidon', 'Hades', 'Ares']], ['Ragnarok', 'Loki', ['Loki', 'Fenrir', 'Surtr']]],
    rows: `
Zeus|M|H|P|45|90|70|95|90|Thunderbolt|sq=96 lr=diva
Hercules|M|F|P|28|90|80|90|62|Twelfth Labour|dur=97 sq=95
Thor|M|F|P|30|89|80|90|70|Hammerfall|dur=92
Achilles|M|F|S|26|88|90|88|70|Wrath of Achilles|dur=40 cons=85
Loki|M|H|E|29|86|76|92|96|Trickster's Turn|lr=toxic
Hades|M|H|E|43|86|64|90|94|River Styx
Ares|M|H|B|33|84|78|82|66|Spear of Ares|hc=90
Odysseus|M|T|T|36|84|86|82|90|Trojan Horse|cons=92 lr=leader
Poseidon|M|H|P|42|84|70|84|74|Tidal Wave
Odin|M|H|T|45|84|70|88|92|Ravens' Eye|lr=mentor
Hector|M|F|A|32|82|84|80|72|Breaker of Horses|lr=gatekeeper
Gilgamesh|M|F|P|35|82|76|86|72|Cedar Forest
Beowulf|M|F|B|30|80|78|80|68|Grendel's Arm
Apollo|M|F|H|25|80|78|90|78|Sun Chariot
The Minotaur|M|H|P|30|78|66|74|20|Labyrinth Gore|dur=90
Anubis|M|H|T|38|78|76|78|60|Weighing of the Heart
Set|M|H|B|36|78|72|76|70|Red Desert
Cu Chulainn|M|F|S|22|78|86|80|62|Warp Spasm|pot=94
Ajax|M|F|P|31|76|72|70|56|Tower Shield
Perseus|M|F|H|24|76|78|78|64|Gorgon's Gaze
Fenrir|M|H|B|26|76|68|70|20|Chainbreaker Bite
Horus|M|F|H|25|76|78|78|66|Eye of Horus
Atlas|M|H|P|44|74|60|72|58|World on His Shoulders
Theseus|M|F|A|27|74|78|76|70|Thread's End
Sigurd|M|F|A|27|74|76|74|62|Dragon's Bane
Jason|M|F|A|29|72|74|76|72|Clashing Rocks
Hermes|M|F|H|22|72|84|80|82|Winged Sandals|fl=95
Surtr|M|H|P|40|72|62|70|40|Flaming Sword
Grendel|M|H|P|28|72|62|66|15|Mead Hall Massacre
Paris|M|H|H|24|70|66|86|74|Judgement Call
Prometheus|M|F|T|38|70|74|72|80|Stolen Fire|dur=95
Baldur|M|F|A|24|70|72|90|70|Mistletoe|dur=35
Enkidu|M|F|B|32|70|72|68|40|Wild Man
Polyphemus|M|H|P|35|70|58|64|30|Nobody Did It
Dionysus|M|H|E|30|70|56|88|86|Last Call
Tyr|M|F|S|33|68|72|66|58|One-Hand Lariat
Finn McCool|M|F|P|34|68|66|72|70|Giant's Causeway
Icarus|M|F|H|20|66|80|76|60|Too Close to the Sun|dur=35 cons=45 safe=40 pot=90
Sobek|M|H|P|33|66|62|62|30|Death Roll
Midas|M|H|E|40|64|52|74|80|Golden Touch
Heimdall|M|F|T|35|64|72|64|56|Bifrost Bridge
Orpheus|M|F|E|26|62|58|84|90|Don't Look Back
Hephaestus|M|F|P|40|62|64|58|52|The Forge
Sisyphus|M|F|B|39|58|64|62|66|The Boulder|cons=95 dur=95 lr=gatekeeper
Athena|F|F|T|30|88|90|86|84|Aegis|cons=94 lr=leader
Medusa|F|H|S|29|84|78|86|74|Stone Gaze
Artemis|F|F|S|24|82|84|80|66|Silver Arrow
Hera|F|H|E|40|82|62|88|90|Queen's Wrath
Freya|F|F|A|28|82|78|88|76|Falcon Cloak
Aphrodite|F|H|E|26|80|58|97|82|Golden Apple
Brunhilde|F|F|P|30|80|78|80|70|Valkyrie's Ride
Hippolyta|F|F|B|31|80|78|80|70|War Belt
Atalanta|F|F|H|23|78|86|78|62|Footrace|pot=92
Helen of Troy|F|H|E|27|78|50|98|76|Thousand Ships
Hel|F|H|P|35|76|66|78|72|Halfway Down
Penthesilea|F|F|S|27|74|78|72|60|Amazon Charge
Sekhmet|F|H|B|31|74|72|74|58|Lioness
Circe|F|H|E|33|72|58|84|86|Swine Song
Nemesis|F|H|T|32|72|74|74|70|Retribution
Bastet|F|F|H|24|70|76|78|60|Nine Lives|dur=88
Persephone|F|T|T|22|70|70|80|72|Six Seeds
Eris|F|H|E|28|70|58|80|86|Apple of Discord
Nike|F|F|H|21|68|76|76|58|Winged Victory|pot=88
Skadi|F|H|S|29|66|72|68|54|Winter Hunt
Sif|F|F|T|26|64|70|76|60|Golden Hair
Cassandra|F|F|E|25|60|56|74|80|Nobody Believes Her
The Oracle of Delphi|F|T|E|45|68|20|84|88||roles=manager br=15 te=20 fl=10 st=25
Tiresias|M|F|E|45|58|20|72|84||roles=manager br=15 te=25 fl=10 st=25` },
  { id: 'pdp', name: 'PDP', full_name: 'Penny Dreadful Pro', blurb: 'The outlaws. Gothic horror after midnight: violent, cheap and beloved by its crowd.', model: 'outlaw', popularity: 48, cash: 3.5e6, work_rate_weight: 0.4, angles_per_show: 2, wage_scale: 0.55, tv_rate: 1300, production_cost: 80000, target_weekly_net: 8000, flagship_month: 10, production_level: 1, risk_level: 3, tv_slot: 0,
    owner: { name: 'Edgar Allan Poe', style: 'drama', roots: 'rebellion', pledge: 'chance' }, staff: { road_agent: 'Dr. John Polidori', head_writer: 'Ann Radcliffe' }, announcers: ['Mary Shelley', 'Bram Stoker'],
    cities: ['Whitby', 'London', 'Sleepy Hollow', 'Baltimore', 'Prague', 'Styria', 'Ingolstadt', 'Edinburgh', 'New Orleans', 'Salem'],
    shows: [['fri', 'Friday Fright Night', 1]],
    titles: [['pdp_world', 'Midnight Title', 'M', 3, 0, ['Sweeney Todd']], ['pdp_grave', 'Graveyard Shift Title', 'M', 2, 0, ['Spring-heeled Jack']], ['pdp_women', "Black Veil Women's Title", 'F', 3, 0, ['Carmilla']], ['pdp_tag', 'Catacomb Tag Titles', 'M', 2, 1, ['The Leopard Man', 'The Hyena-Swine']]],
    teams: [['The Beast Folk', 'The Leopard Man', 'The Hyena-Swine', 80, 4], ['The Crew of Light', 'Jonathan Harker', 'Quincey Morris', 70, 4], ['The Highwaymen', 'Dick Turpin', 'Jack Sheppard', 55, 2], ['The House of Usher', 'Roderick Usher', 'Prince Prospero', 30, -2]],
    stables: [['The Undying', 'Lord Ruthven', ['Lord Ruthven', 'Count Orlok', 'Varney the Vampire']]],
    rows: `
Mr. Hyde|M|H|B|35|82|70|84|60|The Transformation|hc=92 dur=90
Sweeney Todd|M|H|S|38|80|74|82|84|Closest Shave|hc=86
The Phantom|M|H|E|37|80|68|90|88|Chandelier Drop|lr=diva
The Headless Horseman|M|H|B|33|78|72|80|10|Sleepy Hollow|hc=84
Abraham Van Helsing|M|F|T|45|78|76|80|86|Wooden Stake|lr=leader
Count Orlok|M|H|S|45|76|62|86|30|Symphony of Horror
Lord Ruthven|M|H|E|33|74|62|90|84|Byronic Kiss
Spring-heeled Jack|M|H|H|25|74|82|78|40|Leap of Flame|fl=94 pot=88
Wagner the Wehr-Wolf|M|H|B|29|74|70|72|15|Full Moon|hc=88
Krampus|M|H|P|40|72|62|78|50|Birch Bundle|hc=90
The Invisible Man|M|H|T|30|72|74|60|78|Unseen Hand
C. Auguste Dupin|M|F|T|36|70|80|74|82|Rue Morgue|lr=gatekeeper
Dick Turpin|M|H|H|29|70|74|80|76|Stand and Deliver
Varney the Vampire|M|H|T|40|68|70|72|66|Feast of Blood
Jonathan Harker|M|F|A|27|66|72|66|62|Carfax
The Flying Dutchman|M|H|P|42|66|60|72|58|Doomed Voyage
The Mummy of Thebes|M|H|P|44|66|56|70|5|Curse of the Tomb|dur=96
Montresor|M|H|T|38|64|66|70|84|Cask of Amontillado|lr=toxic
Cesare the Somnambulist|M|H|H|25|64|72|70|5|Sleepwalk|mgr=Dr. Caligari
Jack Sheppard|M|H|H|22|62|74|72|66|Newgate Escape|pot=84
Quincey Morris|M|F|B|30|62|66|66|60|Bowie Knife
Prince Prospero|M|H|E|34|62|52|76|80|Red Death
Roderick Usher|M|H|T|32|60|64|68|72|Fall of the House|cons=35 dur=35
Melmoth the Wanderer|M|H|E|45|60|50|76|86|The Bargain
The Leopard Man|M|H|H|24|58|72|62|10|Law Breaker|mgr=Dr. Moreau
The Hyena-Swine|M|H|B|28|58|64|58|10|House of Pain|hc=82 mgr=Dr. Moreau
Manfred of Otranto|M|H|P|41|58|58|64|70|Giant Helmet
Thomas Carnacki|M|F|T|38|58|68|62|70|Electric Pentacle
Carmilla|F|H|T|24|82|80|90|80|Styrian Embrace|sq=92
The Snow Queen|F|H|T|33|76|72|88|78|Sliver of Ice
Baba Yaga|F|H|B|45|74|66|80|82|Mortar and Pestle|hc=86 lr=mentor
The Banshee|F|H|H|27|70|74|76|40|Death Wail
La Llorona|F|H|S|30|68|70|74|50|River's Edge
Mrs. Lovett|F|H|B|38|66|60|74|82|Pie Shop|hc=78
Beatrice Rappaccini|F|H|T|23|66|72|78|64|Poison Garden|pot=84
Bertha Mason|F|H|B|35|64|62|66|20|Attic Fire|hc=84
Ligeia|F|H|E|30|64|58|82|74|Conqueror Worm
Madeline Usher|F|H|S|28|62|66|72|30|Premature Burial|dur=95
The Woman in White|F|T|H|25|62|70|72|50|Limmeridge
Lady Audley|F|H|E|26|62|56|80|84|Lady Audley's Secret
Annabel Lee|F|F|H|20|60|70|82|62|Kingdom by the Sea|pot=86
Rusalka|F|H|H|22|60|70|76|40|Undertow
Elizabeth Lavenza|F|F|T|24|58|68|70|66|Geneva Hold
Lenore|F|F|T|22|56|68|74|60|Nevermore|pot=82
Dr. Moreau|M|H|E|45|62|25|66|84||roles=manager br=20 te=30 fl=10 st=30
Dr. Caligari|M|H|E|45|60|20|72|86||roles=manager br=15 te=20 fl=10 st=25` },
  { id: 'ttt', name: 'TTT', full_name: 'Tall Tale Territory', blurb: 'The underdog. Folk heroes and fairy tales on the county-fair circuit, building what the big companies throw away.', model: 'underdog', popularity: 40, cash: 2.2e6, work_rate_weight: 0.52, angles_per_show: 1, wage_scale: 0.4, tv_rate: 1100, production_cost: 50000, target_weekly_net: 4000, flagship_month: 7, production_level: 1, risk_level: 1, tv_slot: 0,
    owner: { name: 'Mark Twain', style: 'merit', roots: 'tradition', pledge: 'chance' }, staff: { road_agent: 'Daniel Boone', head_writer: 'Hans Christian Andersen' }, announcers: ['Washington Irving', 'Jacob Grimm'],
    cities: ['Hannibal', 'Deadwood', 'Dodge City', 'Tombstone', 'Abilene', 'Natchez', 'Bangor', 'Sleepy Hollow', 'Baghdad', 'Hamelin'],
    shows: [['sat', 'Saturday Tall Tales', 1]],
    titles: [['ttt_world', 'Big Sky Title', 'M', 3, 0, ['John Henry']], ['ttt_frontier', 'Frontier Title', 'M', 2, 0, ['Billy the Kid']], ['ttt_women', "Prairie Rose Women's Title", 'F', 3, 0, ['Calamity Jane']], ['ttt_tag', 'Wagon Train Tag Titles', 'M', 2, 1, ['Tom Sawyer', 'Huckleberry Finn']]],
    teams: [['Tom and Huck', 'Tom Sawyer', 'Huckleberry Finn', 85, 6], ['The Outlaws', 'Jesse James', 'Billy the Kid', 50, 1], ['The Lawmen', 'Wild Bill Hickok', 'Bass Reeves', 60, 4], ['Arabian Nights', 'Sinbad the Sailor', 'Aladdin', 55, 3], ['The Yellow Brick Road', 'The Tin Woodman', 'The Cowardly Lion', 75, 5]],
    stables: [['The Brothers Grim', 'The Big Bad Wolf', ['The Big Bad Wolf', 'Blunderbore the Giant', 'Rumpelstiltskin', 'The Pied Piper']]],
    rows: `
John Henry|M|F|P|30|84|80|88|72|Steel Driver|dur=94 sq=90 lr=leader
Paul Bunyan|M|F|P|35|82|66|86|70|Timber
Pecos Bill|M|F|H|28|80|78|88|84|Cyclone Ride
Davy Crockett|M|F|B|36|78|72|86|88|Bear Hug|lr=mentor
Billy the Kid|M|H|H|21|76|76|86|74|The Regulator|pot=90 sq=88
Jesse James|M|H|B|34|76|70|80|72|Northfield Raid
Wild Bill Hickok|M|F|S|39|74|72|80|70|Dead Man's Hand
Buffalo Bill|M|F|E|45|74|58|92|92|Wild West Show|lr=diva
Bass Reeves|M|F|P|42|74|74|76|68|Marshal's Warrant|cons=92 lr=gatekeeper
Doc Holliday|M|H|T|36|72|70|80|86|The Dentist
Sinbad the Sailor|M|F|H|33|72|74|78|76|Seventh Voyage
Blunderbore the Giant|M|H|P|36|72|58|68|30|Grind His Bones
The Big Bad Wolf|M|H|B|33|70|66|76|76|Huff and Puff
Mike Fink|M|H|B|38|70|66|72|74|Keelboat Brawl
William Tell|M|F|S|37|70|72|72|64|Apple Shot|cons=94
Jack the Giant Killer|M|F|H|22|70|76|76|70|Beanstalk Drop|pot=88
Deadwood Dick|M|F|H|30|68|74|78|72|Deadwood Dash
Aladdin|M|F|H|21|68|72|80|74|Wonderful Lamp|pot=86
Casey Jones|M|F|S|36|66|68|70|62|Cannonball Express
Brom Bones|M|H|P|27|66|64|68|60|Pumpkin Smash
Baron Munchausen|M|H|E|44|66|48|84|94|Cannonball Ride
Jim Bowie|M|F|B|38|66|66|68|60|Sandbar Fight|hc=80
The Tin Woodman|M|F|P|30|64|62|70|60|Axe Handle|dur=96
The Pied Piper|M|H|E|35|64|54|78|82|Follow Me
Old Stormalong|M|F|P|40|62|58|66|58|Kraken's Wake
The Cowardly Lion|M|F|B|28|62|64|74|70|Courage|cons=35
Tom Sawyer|M|H|H|20|62|68|80|84|Whitewash|pot=84
Bat Masterson|M|F|S|40|62|64|68|72|Cane Shot
The Captain of the Thieves|M|H|B|37|62|62|64|62|Forty Thieves
Rumpelstiltskin|M|H|T|45|60|62|70|86|Guess My Name|lr=toxic
Huckleberry Finn|M|F|B|20|60|66|72|66|Lighting Out|pot=84
Ali Baba|M|F|T|35|58|64|66|70|Open Sesame
Johnny Appleseed|M|F|T|40|58|62|66|64|Core Drop
The Scarecrow|M|F|E|26|58|56|72|74|Brains of Bran
Till Eulenspiegel|M|H|E|26|56|58|72|78|Owl and Mirror
Black Bart|M|H|T|42|56|60|64|72|The Po8
Ichabod Crane|M|H|T|32|54|58|58|66|Schoolmaster's Switch
Rip Van Winkle|M|F|E|45|50|46|68|70|Twenty Winks
Calamity Jane|F|F|B|35|76|70|82|80|Calamity
The Evil Queen|F|H|E|38|76|60|88|90|Fairest of Them All
Cinderella|F|F|A|21|74|72|90|70|Midnight Strike|pot=88
The Wicked Witch of the West|F|H|S|45|74|64|82|84|Golden Cap
Belle Starr|F|H|S|33|72|70|76|70|Bandit Queen
Slue-Foot Sue|F|F|H|25|70|74|78|72|Bustle Bounce
Snow White|F|F|T|20|68|70|84|66|Poisoned Apple|pot=84
Dorothy Gale|F|F|H|19|66|70|80|68|Kansas Cyclone|pot=88
Little Red Riding Hood|F|F|S|20|66|70|76|68|Woodcutter's Axe
The Little Mermaid|F|F|H|19|62|72|78|20|Sea Foam
Rapunzel|F|F|H|22|62|68|78|60|Tower Drop
Morgiana|F|F|S|24|62|70|70|68|Boiling Oil
Molly Pitcher|F|F|B|30|62|64|66|60|Cannon Loader
Glinda|F|F|E|30|62|54|82|80|Silver Shoes
Goldilocks|F|H|H|19|60|66|76|72|Just Right
Briar Rose|F|F|E|22|60|58|82|62|Hundred Years' Sleep
Sweet Betsy from Pike|F|F|B|28|58|64|66|62|Crossing the Plains
Gretel|F|F|S|19|56|64|70|64|Gingerbread House|pot=82
Judge Roy Bean|M|H|E|45|58|20|72|86||roles=manager br=25 te=20 fl=10 st=25
Mother Goose|F|F|E|45|60|20|78|84||roles=manager br=15 te=20 fl=10 st=25` }
];

// Four more promotions (rosters in pd-extra.js), with the money that goes with each model.
const EXTRA = {
  nmw: { model: 'startup', popularity: 52, cash: 30e6, angles_per_show: 2, wage_scale: 0.75, tv_rate: 1700, production_cost: 150000, target_weekly_net: -330000, flagship_month: 9, production_level: 3, risk_level: 1, tv_slot: 0 },
  ldd: { model: 'spectacle', popularity: 56, cash: 14e6, angles_per_show: 3, wage_scale: 0.6, tv_rate: 1700, production_cost: 125000, target_weekly_net: 60000, flagship_month: 11, production_level: 3, risk_level: 2, tv_slot: 1 },
  lta: { model: 'tradition', popularity: 50, cash: 12e6, angles_per_show: 1, wage_scale: 0.5, tv_rate: 1300, production_cost: 85000, target_weekly_net: 30000, flagship_month: 9, production_level: 2, risk_level: 1, tv_slot: 1 },
  kjp: { model: 'joshi', popularity: 46, cash: 4.5e6, angles_per_show: 1, wage_scale: 0.45, tv_rate: 1000, production_cost: 65000, target_weekly_net: 14000, flagship_month: 4, production_level: 2, risk_level: 1, tv_slot: 0 }
};
require('./pd-extra.js').forEach(P => { if (!EXTRA[P.id]) throw new Error('no money fields for ' + P.id); PROMOS.push(Object.assign({}, P, EXTRA[P.id])); });

const EVENTS = [
  ['Rubicon', 'no_turning_back'], ['Thermopylae', null], ['Ides of March', 'betrayal'], ['Trojan Horse', null], ['Round Table Rumble', null], ["Midsummer Night's Scream", 'gimmick_free'],
  ['Bastille', null], ['Twelve Labours', null], ['The Odyssey', null], ["All Hallows' Eve", null], ['Gunpowder Plot', null], ['Ragnarok', 'all_titles']
];

const pkg = { manifest: { id: 'public_domain', name: 'The Public Domain Universe', author: 'EWF 9000', version: '1.2', schema_version: 1, fictional: true, start_year: 2026, start_month: 10, free_agents: 36,
  description: 'Nine promotions built from history, myth and fiction published before 1929, reimagined as a modern wrestling world. Each is run a different way.' },
  promotions: [], shows: [], titles: [], workers: [], contracts: [], teams: [], relationships: [],
  events: EVENTS.map((e, i) => (e[1] ? { month: i + 1, name: e[0], rule: e[1] } : { month: i + 1, name: e[0] })),
  sponsors: ['Ironclad Tools', 'Blue Comet Soda', 'Harbor Lager', 'Pinnacle Insurance', 'Redline Auto Parts', 'Summit Sports Drinks', 'Big Sky Jerky', 'Voltage Video Games', 'Northgate Trucks', 'Crown Mattress', 'Copper Kettle Chips', 'Atlas Gyms'],
  columnists: ['Wade Kessler of the Ringside Wire', 'Marnie Okoro of the Turnbuckle Post', 'Felix Dray of Squared Circle Weekly'] };
const byName = {}, seen = {};
const h = s => { let x = 2166136261; for (let i = 0; i < s.length; i++) { x ^= s.charCodeAt(i); x = Math.imul(x, 16777619); } return (x >>> 0) / 4294967296; };
PROMOS.forEach(P => {
  const p = { id: P.id, model: P.model, name: P.name, full_name: P.full_name, blurb: P.blurb, owner: P.owner, staff: P.staff, announcers: P.announcers, cities: P.cities, cash: P.cash, popularity: P.popularity, work_rate_weight: P.work_rate_weight, angles_per_show: P.angles_per_show, wage_scale: P.wage_scale, tv_rate: P.tv_rate, production_cost: P.production_cost, target_weekly_net: P.target_weekly_net, flagship_month: P.flagship_month, production_level: P.production_level, risk_level: P.risk_level, tv_slot: P.tv_slot, media: { logo: 'graphics/logos/' + P.id + '.png' } };
  pkg.promotions.push(p);
  P.shows.forEach(s => pkg.shows.push({ id: P.id + '_' + s[0], promotion_id: P.id, name: s[1], weight: s[2] }));
  P.rows.trim().split('\n').forEach(line => {
    const f = line.split('|'); if (f.length < 10) throw new Error('bad row: ' + line);
    const [name, g, side, style, age, ovr, work, cha, mic, fin] = f, ex = {};
    (f[10] || '').trim().split(/\s+/).filter(Boolean).forEach(kv => { const i = kv.indexOf('='); ex[kv.slice(0, i)] = kv.slice(i + 1); });
    let id = slug(name); if (seen[id]) throw new Error('duplicate ' + name); seen[id] = 1; byName[name] = id;
    const st = STYLE[style], j = k => Math.round((h(name + k) - 0.5) * 6), W = +work;
    const r = { brawling: clamp(ex.br != null ? +ex.br : W + st[0] + j('b'), 10, 99), technical: clamp(ex.te != null ? +ex.te : W + st[1] + j('t'), 10, 99), aerial: clamp(ex.fl != null ? +ex.fl : W + st[2] + j('s'), 10, 99), stamina: clamp(ex.st != null ? +ex.st : W + st[3] + j('m'), 15, 99), charisma: +cha, promo_skill: +mic, overness: +ovr };
    if (ex.hc) r.hardcore = +ex.hc; if (ex.dur) r.durability = +ex.dur; if (ex.safe) r.safety = +ex.safe; if (ex.sq) r.star_quality = +ex.sq; if (ex.cons) r.consistency = +ex.cons; if (ex.pot) r.potential = +ex.pot; if (ex.mor) r.morale = +ex.mor;
    const w = { id, ring_name: name, age: +age, gender: g, disposition: side === 'H' ? 'heel' : (side === 'T' ? 'tweener' : 'face'), roles: ex.roles ? ex.roles.split(',') : ['wrestler'], style: STYLE_NAME[style], ratings: r, media: { portrait: 'graphics/portraits/' + id + '.png' } };
    if (ex.lr) w.locker_role = ex.lr;
    if (FACES[name]) { const q = FACES[name].split(',').map(Number); w.face = { h: q[0], hr: q[1], fh: q[2], ms: q[3], ey: q[4], ns: q[5], sk: q[6], hc: q[7] }; }
    if (fin) w.finisher = fin; if (ex.pk) w.peak_years = ex.pk.split('-').map(Number); if (ex.cl) w.age_cliff = +ex.cl; if (ex.mgr) w._mgr = line.match(/mgr=(.*)$/)[1].trim();
    pkg.workers.push(w);
    pkg.contracts.push({ worker_id: id, promotion_id: P.id, contract_type: 'exclusive', push_level: w.roles.indexOf('wrestler') < 0 ? 'non_wrestler' : (ovr >= P.popularity + 8 ? 'main_eventer' : (ovr >= P.popularity - 2 ? 'upper_midcarder' : (ovr >= P.popularity - 12 ? 'midcarder' : (ovr >= P.popularity - 22 ? 'lower_midcarder' : 'jobber')))) });
  });
  const need = n => { if (!byName[n]) throw new Error('unknown name ' + n + ' in ' + P.id); return byName[n]; };
  P.titles.forEach(t => pkg.titles.push({ id: t[0], promotion_id: P.id, name: t[1], gender: t[2], level: t[3], tag: !!t[4], holder_ids: t[5].map(need), media: { belt: 'graphics/belts/' + t[0] + '.png' } }));
  P.teams.forEach(t => pkg.teams.push({ id: slug(P.id + '_' + t[0]), name: t[0], kind: 'tag', member_ids: [need(t[1]), need(t[2])], experience: t[3], chemistry: t[4], promotion_id: P.id }));
  P.stables.forEach(s => pkg.teams.push({ id: slug(P.id + '_' + s[0]), name: s[0], kind: 'stable', leader_id: need(s[1]), member_ids: s[2].map(need), promotion_id: P.id }));
});
pkg.workers.forEach(w => { if (w._mgr) { if (!byName[w._mgr]) throw new Error('unknown manager ' + w._mgr); w.manager_id = byName[w._mgr]; delete w._mgr; } });
const REL = [].concat(...PROMOS.map(P => P.rels || []), [
  ['Sherlock Holmes', 'Professor Moriarty', 'rivalry', -90, 8, 'The final problem.'], ['Sherlock Holmes', 'Dr. John Watson', 'friendship', 90, 6, ''], ['Julius Caesar', 'Brutus', 'friendship', 70, 4, 'For now.'],
  ['King Arthur', 'Mordred', 'family', -60, 5, 'Father and son.'], ['King Arthur', 'Sir Lancelot', 'friendship', 60, 6, 'Until Guinevere.'], ['Romulus', 'Remus', 'family', 40, -3, 'Brothers, and it shows.'],
  ['Dracula', 'Abraham Lincoln', 'rivalry', -70, 7, ''], ['Robin Hood', 'Little John', 'friendship', 80, 5, ''], ['Don Quixote', 'Sancho Panza', 'friendship', 85, 5, ''], ['Jean Valjean', 'Inspector Javert', 'rivalry', -85, 7, ''],
  ['Achilles', 'Hector', 'rivalry', -90, 9, ''], ['Thor', 'Loki', 'family', -40, 7, ''], ['Gilgamesh', 'Enkidu', 'friendship', 95, 7, ''], ['Zeus', 'Hera', 'family', -30, 0, ''], ['Athena', 'Medusa', 'rivalry', -80, 6, ''], ['Odysseus', 'Polyphemus', 'rivalry', -70, 3, ''],
  ['Napoleon Bonaparte', 'The Duke of Wellington', 'rivalry', -85, 8, ''], ['Richard the Lionheart', 'Saladin', 'rivalry', -40, 9, 'Respect on both sides.'], ['Elizabeth I', 'Mary, Queen of Scots', 'family', -70, 5, 'Cousins.'], ['Plato', 'Aristotle', 'mentor', 60, 4, ''], ['Socrates', 'Plato', 'mentor', 80, 3, ''],
  ['Mr. Hyde', 'C. Auguste Dupin', 'rivalry', -50, 4, ''], ['Carmilla', 'Abraham Van Helsing', 'rivalry', -80, 5, ''], ['Sweeney Todd', 'Mrs. Lovett', 'partners', 70, 4, ''], ['The Headless Horseman', 'Spring-heeled Jack', 'dislike', -40, -4, ''],
  ['Tom Sawyer', 'Huckleberry Finn', 'friendship', 90, 6, ''], ['Pecos Bill', 'Slue-Foot Sue', 'family', 80, 0, ''], ['Jack the Giant Killer', 'Blunderbore the Giant', 'rivalry', -85, 7, ''], ['Little Red Riding Hood', 'The Big Bad Wolf', 'rivalry', -80, 0, ''], ['Snow White', 'The Evil Queen', 'rivalry', -90, 6, ''], ['Dorothy Gale', 'The Wicked Witch of the West', 'rivalry', -85, 5, ''], ['John Henry', 'Paul Bunyan', 'friendship', 50, -3, 'Two big men who get in each other\'s way.']
]);
REL.forEach(r => { if (!byName[r[0]] || !byName[r[1]]) throw new Error('unknown in relationship ' + r[0] + ' / ' + r[1]); const o = { a: byName[r[0]], b: byName[r[1]], type: r[2], strength: r[3], ring_chemistry: r[4] }; if (r[5]) o.note = r[5]; pkg.relationships.push(o); });
const out = path.join(__dirname, '..', 'universes', 'public_domain.json');
fs.writeFileSync(out, JSON.stringify(pkg));
console.log('wrote', out, 'workers', pkg.workers.length, 'per promotion', PROMOS.map(P => P.id + ':' + pkg.contracts.filter(c => c.promotion_id === P.id).length).join(' '), 'women', pkg.workers.filter(w => w.gender === 'F').length, 'KB', Math.round(JSON.stringify(pkg).length / 1024));
