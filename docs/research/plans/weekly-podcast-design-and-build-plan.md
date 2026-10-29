<!-- Text copy of the PDF beside it (pdftotext -layout), so it can be searched. The PDF is the source. -->
Weekly podcast: design and build plan

 Weekly podcast: design and build plan

   Oct 21, 2026 � @Bill
  The chat room window on the Web page becomes a weekly video podcast: two original
  hosts talk through the week in wrestling, written from what really happened in your game,
  with paper-doll animation and closed captions on every line.

 What the chat room is today

  The chat room is one window on the Web page, and only the window goes. The posts
  behind it stay, because other screens read them.

      The window: app/src/screens/net/Feed.tsx , shown by Web.tsx as the "Chat room"
      window between the dirt sheet and Wrestle Search. It is read only: "You are lurking."
      The posts: S.feed , written in src/94-net.js after every show (winners, losers, new
      champions, the company, the columnist) and two to four fan lines from the GR_CHAT
      grammar in src/60-grammar.js .
      Who else reads S.feed : the desk shows a wrestler's post ( office/Desk.tsx ). The
      broadcast's Ringside feed is a separate list and is not touched.
      Tests that name it: app/tests/net.js (the window, the scroll, the empty room) and
       test-grammar.js (chat lines).
  So the plan keeps S.feed and GR_CHAT as raw material. Fan lines become listener mail
  and wrestlers' posts become quotes the hosts react to. Nothing in the save is thrown
  away.

 The show and its two hosts

  The show follows the shape of a weekly newsletter radio show: a writer who knows
  everything and a former wrestler who keeps him honest. Both hosts are original game
  characters with no real person's name, voice or look (rule 3).

                                                                                                                                                                                                                                                      Page 1 of 6
Weekly podcast: design and build plan

                                       The writer (host A)                 The ex-wrestler (host B)

Who they are in                        The press reporter on the ring      A retired wrestler from the world
the game                               beat, already in S.press with a     with a good mic (a second
                                       name, a lean and how warm they      career). If there is none, an
How they talk                          are to you                          original name from the press
What they know                                                             name lists
Running bits
                                       Long, sure of the facts, history    Short, dry jokes, says how a
                                       callbacks, star ratings for         match was worked, argues the
                                       everything                          other side

                                       What the press knows: sure, likely  What the locker room thinks:
                                       and thin rumours, and corrections   morale, who is hot, who looked
                                       when wrong                          lost

                                       Rates the catering in stars. "We    Times the writer's tangents. Asks
                                       have a lot to get to."              "was it a good match though?"

The show takes its name from the world's dirt sheet: S.columnist plus "Radio" ("The
Ringside Wire Radio" by default). A world package can bring its own show name and hosts
later.

Because host A is a press reporter, the court and freeze actions you already have carry
over. Take them to dinner and the takes on your shows warm up; freeze them out and the
podcast turns on you.

An episode, segment by segment

One episode comes out at the end of every week, about 40 to 70 lines and three to six
minutes at normal speed. Each segment runs only when the week gave it something true
to say (the grammar's rule), so no two weeks sound the same.

# Segment                              What they talk about                Where it comes from

1  Cold open                           Theme sting, title card, one line   The top entry in this week's causal
                                       on the biggest story of the         log ( S.clog )
                                       week

                                                                                                           Page 2 of 6
Weekly podcast: design and build plan

# Segment                              What they talk about                 Where it comes from

2  Your show                           Grade against the crowd, best        The show report from SHOWX :
                                       match in stars, the finish, a title  segs , rating , exp , att ,
                                       change, a turn                       sellout , change

3  The other                           Rivals' big nights, who stole a      Rival show reports and their big
                                       show                                 flag
   shows

4  Feud watch Which feud is hot, which is                                   S.feuds : heat , fresh , res ,

                                       dragging, which just ended           end

5  Business                            Crowds, gates, audience share, E.shareOf , S.news (contract,

                                       network trouble, contracts           world), the networks

6  Rumour mill "I am hearing...", host B doubts                             netRumours() levels and S.rumR

                                       it; last week's calls checked        confirmations and corrections

7  The title                           Every champion, who is next in       Titles and holders, E.rankFor
                                       line, a top ten
   picture

8  Mailbag                             Listener mail read out               The GR_CHAT fan lines, now
                                                                            written as mail with a screen
                                                                            name

9  Picks and                           Picks for the next big night,        nextBigName() and the hot
                                       then goodbye                         feuds; picks are kept and scored
   sign off                                                                 next episode

Every four weeks the episode adds the month in review from S.pm , and once a year a
season special. Wrestlers' own posts from S.feed are quoted inside segments 2 and 3
("After the show, X posted...").

Animation, voices and closed captions

The podcast is a video podcast drawn by the diorama engine the game already has, so it
needs no new kind of art. Most pieces exist today: the desk scene with mouths that move
( deskScene in app/src/kit/scene.ts ), suited and headset dolls, keyframes, camera
moves and captions in four styles.

The picture

                                                                                                            Page 3 of 6
Weekly podcast: design and build plan

      A new set, the studio: two microphones on arms, headphones, a desk with the
      newsletter and a coffee, an ON AIR light, the show's name lettered on card behind
      them. It is cut from card like every other set (rule 2a).
      Two host dolls with their own looks (glasses and a cardigan for A, a cap and a t-shirt for
      B), built from the same recipes as wrestlers.
      Loops per line: A talking, B talking, both laughing, an argument, reading mail off a sheet.
      Cutaways while they talk about something: the champion with the belt over the
      shoulder (dolls already wear belts), the two in a feud face to face, the poster for the
      next show, a top ten board with portraits, a star card for the best match. These are the
      same pictures Bill asked for elsewhere, so the work is shared.
  The voices
      Default: a short babble of soft tones per syllable, pitched per host, from the sound
      code already in app/src/sfx.ts . It works on every computer with no files, like the
      voices in many handmade games.
      Option: the computer's own text to speech where it has voices. Some computers have
      no voices installed, so it is never required.
  Closed captions
      On by default, at the bottom of the picture, each line with the speaker's name in their
      colour. Sound tags in brackets: [theme plays], [laughs], [papers rustle].
      Options for caption size and a solid box behind them.
      A transcript tab beside the player lists every line, so an episode can be read instead of
      watched. Segments are chapters you can jump to.
      A line stays up for its length in words at the reading speed set in Options. Reduce
      motion shows still pictures and the captions still advance.

 How it keeps the game's rules

  The podcast only reads the game, the same way the Net section does today.
      Never changes a game: every pick uses h01() hashes, never rnd(S) , so test-
      determinism.js still passes and a podcast line can never change a result.
      Fog of war: the hosts know what the press knows. A secret that has not leaked is never
      said on air, and thin rumours are sometimes wrong and corrected later.
      Saves: episodes live in a new S.pod (the last four, like the dirt sheet's four issues). It is
      made the first time it is needed, so old saves load with no version bump (rule 9).

                                                                                                                                                                                                                                                      Page 4 of 6
Weekly podcast: design and build plan

      Engine owns the game: the engine writes the script; the screen only plays it (rule 1).
      No outside files: set, dolls, babble and theme sting are all drawn or played by code
      (rule 2).
      Four inputs: play, pause, next and last line, chapters and captions are real buttons with
       data-t names, so mouse, touch, keys and a pad all work (rule 5).
      Plain words, no dice wording, stars after the bell: the new lines go through test-
      wording.js and test-grammar.js (rules 4, 8, 8a).
      Information only: Web stays a page with nothing to decide (rule 6). The player opens as
      a pop-up from a short tile (rule 6a).
  Screen size (Bill, 21 October): built for 1080p only, using the whole screen. The player
  opens full screen: the picture large on the left, the chapters and transcript in a column on
  the right, and the controls along the bottom. There is no Steam Deck or small-screen
  layout.

 Build plan

  Four phases, each one a pull request that leaves the game working. Phases 1 and 2 give a
  playable podcast on the existing desk set; phase 3 makes it look finished.
   1. The script (engine). About two days.

          New src/99-zpodcast.js , named to sort after 99-press.js and 99-
          postmortem.js so its end-of-week hook runs after theirs. It writes S.pod.eps[0] =
           {w, n, title, segs, lines} ; each line is {who, t, seg, pic} , where pic says
          which loop or cutaway to show.
          New rule set GR_POD in src/60-grammar.js , with each host's voice. GR_CHAT stays
          and feeds the mailbag.
           E.podcast(S) and E.podEp(S, n) for the screen. The hosts are picked once and
          kept in S.pod.hosts .
          New test-podcast.js : 60 weeks of every company, an episode each week, every
          segment true of the game, no empty slots, no secret said early, same seed gives the
          same words. Add it to CLAUDE.md's command list.
   2. The player (screen). About two days.
           app/src/screens/net/Podcast.tsx replaces Feed.tsx in the Web page's middle
          window: the newest episode as a tile, the last four below it.

                                                                                                                                                                                                                                                      Page 5 of 6
Weekly podcast: design and build plan

          The pop-up player: ScenePlayer in a 16 by 9 box on the desk set for now, captions,
          transcript, chapters, the babble voice, and play, pause, next, last and speed controls.
          A note on the notification bar when a new episode is up and your show is in it.
          Update app/tests/net.js from chat room checks to podcast checks; update the
          start screen line, README and CLAUDE.md rule 6.
   3. The studio and the cutaways (look). About three days.
          The studio set and the two host dolls in scene.ts and puppet.ts , made in Create a
          Scene like the game's other scenes.
          Cutaways: champion with the belt on the shoulder, face to face, poster, top ten
          board, star card.
          The theme sting and caption options.
   4. Depth (later, pick and choose).
          Picks scored over the year ("the writer is 31 and 12 this year").
          Book a wrestler as a guest from Manage: a good mic lifts them, a bad one is a story.
          A world package brings its own show name and hosts; a rival company's podcast.
          Call-in callers with their own voices; the computer's speech as an option.

 Calls for Bill

      Go ahead to build? The plan is phases 1 and 2 on a branch, then a pull request for you
      to try. Nothing is changed in the repo yet.
      Information only, or a small effect? Recommended: information only, like the rest of
      Web. The alternative is that the hosts' take nudges how fans feel about a wrestler a
      little.
      Voices: babble plus captions by default, with the computer's speech as an option. Say
      if you want speech on by default.
      The show name: "The Ringside Wire Radio" from the dirt sheet, or a name you pick.

                                                                                                                                                                                                                                                      Page 6 of 6

