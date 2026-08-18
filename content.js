/* ===================== SURVEY CONTENT =====================
   AI Recommendations - Pretests 1, 2, 3
   Source: 03_Instruments/Questionnaires_Pretests.docx
   Design:  02_ResearchDesign/ProjectLog_080726.md
   Revision 2026-08-17: wording and layout revisions (items 1-19)
   ========================================================= */

/* 7-point agreement labels (item 7: somewhat -> slightly) */
const AGREE = ["Strongly<br>disagree", "Disagree", "Slightly<br>disagree",
               "Neither disagree<br>nor agree", "Slightly<br>agree", "Agree",
               "Strongly<br>agree"];

/* item 4: the "INSTRUCTIONS" heading is gone.
   item 2: instruction text is italic, scenario text one step larger. */
const INSTR = '<p class="instr">Please read the following situation carefully and imagine it ' +
              'as vividly as you can, as if it were really happening to you.</p>';

const RESET = '<div class="reset">This is a new and separate situation. Please read it on ' +
              'its own, and set aside anything you read earlier in this survey.</div>';

const CONSENT_HTML = `
<h2>Informed Consent</h2>
<p>You are invited to participate in a short research study. The purpose of this study is to
evaluate how consumers perceive information presented in a restaurant related mobile app.
If you volunteer to participate, you will view app information and several short scenarios, and
then complete a survey in which you make ratings based on the information provided. The survey
will take about 4 to 10 minutes of your time. There will not be direct benefits to you as a
participant in this study. This study includes only minimal risks although there are risks
involved in all research studies. You may feel uncomfortable when answering some of the
questions. You may discontinue participation at any time. There will not be a financial cost to
you to participate in this study. Your participation in this study is voluntary. You may refuse
to participate in this study or in any part of this study without any consequences.</p>
<p>All information gathered in this study will be kept completely confidential. No reference will
be made in written or oral materials that could link you to this study. All records will be
stored in a locked facility at Kyonggi University for 3 years after completion of the study.
After the storage time, the information gathered will be completely discarded.</p>
<p>If you have any questions or concerns about the study, you may contact Dr. Eun Joo Kim at
<a href="mailto:ejkim@kyonggi.ac.kr">ejkim@kyonggi.ac.kr</a>. If you agree to participate, please
continue with the survey. If you do not wish to participate, please decline by selecting
&ldquo;I do not consent.&rdquo;</p>
<p><strong>I have read the above information and agree to participate in this study. I have been
able to ask questions about the research study. I am an adult over 19 years old.</strong></p>`;

/* ============================ PRETEST 1 ============================ */
/* AI conditions now form a 1 -> 2 -> 4 gradient in list size, so the
   manipulation check has a middle point to separate them. */
const P1_CONDS = ["SELF", "AIT", "AI2", "AI4"];

const P1_INTRO_HTML = INSTR +
  '<p class="scenario">It is a regular Tuesday. Nothing in particular is happening today. You ' +
  'do not feel like cooking, so you decide to have dinner out with someone you eat with often. ' +
  'So, you open a restaurant information mobile app (e.g., Yelp, OpenTable, Google Maps) to ' +
  'find a place to eat. On the app&rsquo;s first screen, a banner to advertise AI recommendation ' +
  'appears.</p>' +
  '<img class="stim" src="img/P1_banner_screen.png" alt="App first screen with AI banner">';

/* item 10: "You tap the banner" -> "You tap the AI recommendation banner" */
const P1_STIM = {
  SELF: '<p class="scenario">You skip past the banner and go to the search screen. The list you ' +
        'end up looking at is one <strong>you</strong> put together, from what you like based on ' +
        'your own experience.</p>' +
        '<img class="stim" src="img/P1_cond1_SelfTopPick.png" alt="Search result screen">',
  AIT:  '<p class="scenario">You tap the AI recommendation banner. The list you end up looking ' +
        'at is one <strong>the app</strong> put together, from what you would like based on your ' +
        'past preferences.</p>' +
        '<img class="stim" src="img/P1_cond2_AITopPick.png" alt="AI recommendation screen">',
  AI2:  '<p class="scenario">You tap the AI recommendation banner. The list you end up looking ' +
        'at is one <strong>the app</strong> put together, from what you would like based on your ' +
        'past preferences.</p>' +
        '<img class="stim" src="img/P1_cond4_AI2.png" alt="AI recommendation screen">',
  AI4:  '<p class="scenario">You tap the AI recommendation banner. The list you end up looking ' +
        'at is one <strong>the app</strong> put together, from what you would like based on your ' +
        'past preferences.</p>' +
        '<img class="stim" src="img/P1_cond3_AIFour.png" alt="AI recommendation screen">'
};

const P1_STAGE2_HTML =
  '<p class="scenario">You settle on a restaurant from what was on your screen previously shown ' +
  'and tap through to book a table for the evening.</p>';

const AGREE_STEM = "Please indicate how much you agree with each statement.";

/* item 11: the three manipulation checks are asked in Stage 1, before a
   restaurant has been chosen.  item 9: singular/plural handled as "restaurant(s)". */
function p1Stage1Questions(c) { return [
 {id:"P1_"+c+"_SUB", type:"grid", stem:AGREE_STEM, labels:AGREE, items:[
   "The restaurant(s) I looked at were put together by the app.",
   "The app decided which restaurant(s) appeared on my screen.",
   "The restaurant(s) I saw were picked out for me rather than by me."]},
 {id:"P1_"+c+"_SOURCE", type:"radio", stem:"Who chose the restaurant(s) you looked at?",
   options:["I did","The app did"]},
 {id:"P1_"+c+"_SIZE", type:"radio", stem:"How many restaurants did you see on the screen?",
   options:["1","2–4","5 or more","Don’t remember"]}
];}

function p1Stage2Questions(c) { return [
 {id:"P1_"+c+"_PO", type:"grid", stem:AGREE_STEM, labels:AGREE, items:[
   "This choice of restaurant feels like my own.",
   "This place feels like my find.",
   "The way I ended up at this restaurant feels like mine.",
   "I feel a strong sense of personal ownership over how this restaurant came about."]},
 {id:"P1_"+c+"_DV", type:"grid", stem:AGREE_STEM, labels:AGREE, items:[
   "This restaurant was a new discovery for me.",
   "Coming across this place broadened the range of dining options I know about.",
   "Finding out about this place was interesting in itself.",
   "There was something to discover in this place."]}
];}

/* ============================ PRETEST 2 ============================ */
const P2_CONDS = ["S1L","S1H","S2L","S2H","S3L","S3H"];

/* item 16: set 2 low now introduces the companion before "neither of you" */
const P2_TEXT = {
 S1L:"It is a regular Tuesday. Nothing in particular is happening today. You do not feel like cooking, so you decide to have dinner out with someone you eat with often.",
 S1H:"Something worth celebrating came up today, and you want to mark it tonight rather than let it pass. You decide to go out for dinner with someone close to you.",
 S2L:"You worked late, and you are going out for dinner with someone you eat with often. Neither of you feels like cooking, and it is the same week as any other week.",
 S2H:"The news you had been waiting on came through today. You want to sit down somewhere tonight and let it feel like the day it was. You decide to go out for dinner with someone close to you.",
 S3L:"It is a regular weekday. You are going out for dinner tonight with someone you live with. Neither of you is in the mood to make anything of it, and you just want somewhere to eat.",
 S3H:"One of your friends got promoted today, and a few people from your circle decided this morning to get together for dinner tonight. Finding the place is up to you, as it usually is. With this group it has always been your call, and whatever you land on is where everyone will end up."
};

/* item 15: booking bridge, shown after the occasion items and before the
   items that presuppose a chosen restaurant. */
const P2_BRIDGE_HTML =
  '<p class="scenario">So, you open a restaurant information mobile app (e.g., Yelp, OpenTable, ' +
  'Google Maps) to find a place to eat. On the app&rsquo;s first screen, there is a list of ' +
  'restaurant recommendations. You settle on a restaurant from the list and tap through to book ' +
  'a table for the evening.</p>';

/* item 14: the two occasion ratings are one matrix with anchors on both sides */
function p2OccasionQuestion(c) { return {
  id:"P2_"+c+"_OCC", type:"bipolar",
  stem:"The reason you were going out to dinner tonight was:",
  rows:[{lo:"Very ordinary",        hi:"Very extraordinary"},
        {lo:"Not special at all",   hi:"Very special"},
        {lo:"Not important at all", hi:"Very important"}]
};}

function p2AfterBridgeQuestions(c) { return [
 {id:"P2_"+c+"_IR", type:"grid", stem:AGREE_STEM, labels:AGREE, items:[
   "The restaurant I choose here would say something about who I am.",
   "In this situation, my restaurant choice reflects my personal taste.",
   "Where I eat here is part of how I present myself."]},
 {id:"P2_"+c+"_INV", type:"grid", stem:AGREE_STEM, labels:AGREE, items:[
   "I was highly interested while deciding where to eat.",
   "I was highly involved in deciding where to eat."]},
 {id:"P2_"+c+"_EFF", type:"grid", stem:"Please indicate how much you agree with the statement.",
   labels:AGREE, items:[
   "I would put a lot of effort into deciding where to eat in this situation."]}
];}

/* ============================ PRETEST 3 ============================ */
const P3_CONDS = ["S1STD","S1SER","S2STD","S2SER","S3STD","S3SER"];

const P3_LEAD =
  '<p class="scenario">You are going out for dinner tonight, so you open a restaurant ' +
  'information app such as Yelp, OpenTable, or Google Maps to find a place to eat.</p>' +
  '<p class="scenario">The app shows you one restaurant as a match for your taste. Following ' +
  'the suggestion, you open the page for that restaurant and read through it.</p>';

/* item 17: a lead-in line, extra space, and the manipulation itself in bold */
const P3_LEADIN = '<p class="leadin">After checking out the restaurant information &hellip;</p>';

/* items 4-6: the first clause is not bold, so participants do not decide
   from the opening words alone. {plain, bold} */
const P3_TEXT = {
 S1STD:{plain:"", bold:"The recommended restaurant is exactly the sort of place you go for. It matches what you usually look for, and it feels familiar to you before you have even been there."},
 S1SER:{plain:"The recommended restaurant is not exactly the sort of place you go for. It is not what you would normally look for,",
        bold:"yet it looks like somewhere you would enjoy, and coming across it feels like a pleasant surprise."},
 S2STD:{plain:"", bold:"The food and the atmosphere here are the kind you go for most weeks. You normally like this type of food, and you know how it will taste before it arrives."},
 S2SER:{plain:"The food here is a kind you have rarely had. You wonder how it will taste,",
        bold:"but the menu reads like something that would suit you, and it gives you an unexpected craving."},
 S3STD:{plain:"", bold:"This place has been getting your attention lately. You have heard the name before and have been meaning to try it at some point. Its rating is high and it has a large number of reviews."},
 S3SER:{plain:"This place is new to you.",
        bold:"Yet its rating is high and it has a large number of reviews, which catches you off guard. You find yourself wondering how you had never come across it until now, and you feel lucky that it turned up."}
};
/* item 18: participants have only read about the restaurant, not visited it,
   so the perception items are phrased as impressions rather than experience. */
function p3Questions(c) { return [
 {id:"P3_"+c+"_SER", type:"grid", stem:AGREE_STEM, labels:AGREE, items:[
   "This restaurant seems similar to the places I usually go to.",
   "This restaurant does not seem to be the style of place I usually go to.",
   "Coming across this restaurant felt like a pleasant surprise."]},
 {id:"P3_"+c+"_REL", type:"grid", stem:AGREE_STEM, labels:AGREE, items:[
   "This place seems to suit me.",
   "This place seems to match what I care about in a restaurant."]},
 {id:"P3_"+c+"_APP", type:"grid", stem:AGREE_STEM, labels:AGREE, items:[
   "This restaurant looks like it would fit my preferences well.",
   "I think I would like this restaurant."]},
 {id:"P3_"+c+"_DV", type:"grid", stem:AGREE_STEM, labels:AGREE, items:[
   "This restaurant would be a new discovery for me.",
   "Coming across this place would broaden the range of dining options I know about.",
   "Finding out about this place was interesting in itself.",
   "There seems to be something to discover in this place."]}
];}

/* ============================ end-of-survey checks ============================
   item 3: realism and immersion are asked once, not after every scenario. */
const CHECK_QUESTION = {
  id:"CHK", type:"bipolar",
  stem:"Thinking back over the whole survey:",
  rows:[
   {lab:"The restaurant app screen you saw looked &hellip;",
    lo:"Not at all realistic", hi:"Very realistic"},
   {lab:"The situations you read about seemed &hellip;",
    lo:"Not at all realistic", hi:"Very realistic"},
   {lab:"You could picture yourself in those situations &hellip;",
    lo:"Not at all vividly", hi:"Very vividly"}]
};

/* ============================ design ============================ */
/* One condition per part (2026-08-17). Reading several similar dinner
   scenarios in a row produced fatigue and within-participant comparison;
   between-subjects on every part removes both and takes 6-7 minutes. */
/* P1 is always presented first (2026-08-18). P1 carries the app screen that
   establishes the setting; P2 and P3 are then shuffled between themselves. */
const PART_ORDERS = [["P1","P2","P3"],["P1","P3","P2"]];
