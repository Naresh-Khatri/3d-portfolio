export type Article = {
  id: string;
  title: string;
  authors: string;
  venue?: string;
  year?: number;
  category: string;
  url?: string;
  thoughts?: string;
};

export type Quote = {
  id: string;
  text: string;
  author?: string;
  source?: string;
  category?: string;
};

// Curated collection of academic papers and articles that influence research and thinking
// Inspired by Andre Ye's articles collection
export const articles: Article[] = [
  {
    id: "attention-is-all-you-need",
    title: "Attention Is All You Need",
    authors: "Vaswani et al.",
    venue: "NeurIPS",
    year: 2017,
    category: "Deep Learning",
    url: "https://arxiv.org/abs/1706.03762",
    thoughts: "The transformer architecture revolutionized NLP and became the foundation for modern LLMs. This paper's elegant simplicity—attention mechanisms without recurrence—inspired my work on LLM-powered systems.",
  },
  {
    id: "human-level-control",
    title: "Human-level control through deep reinforcement learning",
    authors: "Mnih et al.",
    venue: "Nature",
    year: 2015,
    category: "Reinforcement Learning",
    url: "https://www.nature.com/articles/nature14236",
    thoughts: "Demonstrated that deep RL could achieve human-level performance in complex games. This paper motivated my traffic signal optimization project using RL.",
  },
  {
    id: "retrieval-augmented-generation",
    title: "Retrieval-Augmented Generation for Knowledge-Intensive NLP Tasks",
    authors: "Lewis et al.",
    venue: "NeurIPS",
    year: 2020,
    category: "NLP",
    url: "https://arxiv.org/abs/2005.11401",
    thoughts: "RAG architecture directly influenced my customer support bot project. The idea of combining retrieval with generation for accurate, context-aware responses is elegant.",
  },
  {
    id: "language-models-are-few-shot",
    title: "Language Models are Few-Shot Learners",
    authors: "Brown et al.",
    venue: "NeurIPS",
    year: 2020,
    category: "LLMs",
    url: "https://arxiv.org/abs/2005.14165",
    thoughts: "GPT-3's few-shot learning capabilities showed the emergent power of scale. This paper shaped my understanding of how LLMs can adapt to new tasks with minimal examples.",
  },
  {
    id: "proximal-policy-optimization",
    title: "Proximal Policy Optimization Algorithms",
    authors: "Schulman et al.",
    venue: "arXiv",
    year: 2017,
    category: "Reinforcement Learning",
    url: "https://arxiv.org/abs/1707.06347",
    thoughts: "PPO's stability and sample efficiency made it ideal for my traffic simulation work. The clipped objective function is beautifully simple yet effective.",
  },
  {
    id: "bert",
    title: "BERT: Pre-training of Deep Bidirectional Transformers for Language Understanding",
    authors: "Devlin et al.",
    venue: "NAACL",
    year: 2019,
    category: "NLP",
    url: "https://arxiv.org/abs/1810.04805",
    thoughts: "BERT's bidirectional context understanding was a breakthrough. The pre-training + fine-tuning paradigm influenced my approach to transfer learning in NLP tasks.",
  },
];

export const quotes: Quote[] = [
  {
    id: "turing-quote",
    text: "We can only see a short distance ahead, but we can see plenty there that needs to be done.",
    author: "Alan Turing",
    category: "Philosophy",
  },
  {
    id: "fei-fei-li",
    text: "AI is not about replacing humans, it's about augmenting human capabilities.",
    author: "Fei-Fei Li",
    category: "AI Ethics",
  },
  {
    id: "geoffrey-hinton",
    text: "I don't think it's useful to have a big goal. I think it's useful to have a direction.",
    author: "Geoffrey Hinton",
    category: "Research",
  },
  {
    id: "richard-feynman",
    text: "What I cannot create, I do not understand.",
    author: "Richard Feynman",
    category: "Learning",
  },
  {
    id: "yann-lecun",
    text: "Most of human and animal learning is unsupervised learning. If intelligence is a cake, the bulk of the cake is unsupervised learning.",
    author: "Yann LeCun",
    category: "Machine Learning",
  },
  {
    id: "demis-hassabis",
    text: "The goal of AI should be to create systems that can learn and think like humans, but also go beyond human capabilities.",
    author: "Demis Hassabis",
    category: "AI Vision",
  },
  {
    id: "coleridge-language",
    text: "For language is the armory of the human mind; and at once contains the trophies of its past, and the weapons of its future conquests.",
    author: "Samuel Taylor Coleridge",
    category: "Skepticism of Platonist formulations",
  },
  {
    id: "brandom-descartes",
    text: "For he defined the mind by its epistemic status, as what is best known to itself by falling within the reach of the subject's incorrigibility and local omniscience.",
    author: "Robert Brandom, on Descartes",
    category: "Skepticism of Platonist formulations",
  },
  {
    id: "deleuze-hilbert",
    text: "Hilbert and de Broglie were as much politicians as scientists: they reestablished order.",
    author: "Deleuze and Guattari, A Thousand Plateaus",
    category: "Skepticism of Platonist formulations",
  },
  {
    id: "schopenhauer-life",
    text: "The scenes of our life are like pictures in rough mosaic, which have no effect at close quarters, but must be looked at from a distance in order to discern their beauty. So that to obtain something we have desired is to find out that it is worthless; we are always living in expectation of better things, while, at the same time, we often repent and long for things that belong to the past. We accept the present as something that is only temporary, and regard it only as a means to accomplish our aim. So that most people will find if they look back when their life is at an end, that they have lived their lifelong ad interim, and they will be surprised to find that something they allowed to pass by unnoticed and unenjoyed was just their life — that is to say, it was the very thing in the expectation of which they lived. And so it may be said of man in general that, befooled by hope, he dances into the arms of death.",
    author: "Arthur Schopenhauer",
    category: "Skepticism of Platonist formulations",
  },
  {
    id: "butler-performativity",
    text: "The misapprehension about gender performativity is this: that gender is a choice, or that gender is a role, or that gender is a construction that one puts on, as one puts on clothes in the morning, that there is a 'one' who is prior to this gender, a one who goes to the wardrobe of gender and decides with deliberation which gender it will be today.",
    author: "Judith Butler, Bodies That Matter",
    category: "Skepticism of Platonist formulations",
  },
  {
    id: "sartre-existential",
    text: "But in reality and for the existentialist, there is no love apart from the deeds of love; no potentiality of love other than that which is manifested in loving; there is no genius other than that which is expressed in works of art. The genius of Proust is the totality of the works of Proust; the genius of Racine is the series of his tragedies, outside of which there is nothing. Why should we attribute to Racine the capacity to write yet another tragedy when that is precisely what he did not write? In life, a man commits himself, draws his own portrait and there is nothing but that portrait.",
    author: "Jean-Paul Sartre",
    category: "Skepticism of Platonist formulations",
  },
  {
    id: "lakatos-conjectures",
    text: "I shall tell you. You yourself said you failed many times to fit them into a formula. Now what happened was this: you had three or four conjectures which in turn were quickly refuted. Your table was built up in the process of testing and refuting these conjectures. These dead and now forgotten conjectures suggested the facts, not the facts the conjectures. Naive conjectures are not inductive conjectures: we arrive at them by trial and error, through conjectures and refutations.",
    author: "Imre Lakatos",
    category: "Skepticism of Platonist formulations",
  },
  {
    id: "arendt-eichmann",
    text: "The trouble with Eichmann was precisely that so many were like him, and that the many were neither perverted nor sadistic, that they were, and still are, terribly and terrifyingly normal. From the viewpoint of our legal institutions and of our moral standards of judgment, this normality was much more terrifying than all the atrocities put together.",
    author: "Hannah Arendt",
    category: "Skepticism of Platonist formulations",
  },
  {
    id: "lakatos-eulerian",
    text: "ZETA: No, Omega. 'More questions may be easier to answer than just one question. A new more ambitious problem may be easier to handle than the original problem.' Indeed, I shall show you that your narrow, accidental problem can only be solved by solving the wider, essential problem.",
    author: "Imre Lakatos, from Proofs and Refutations",
    category: "Skepticism of Platonist formulations",
  },
  {
    id: "arendt-thoughtlessness",
    text: "He was not stupid. It was sheer thoughtlessness - something by no means identical with stupidity - that predisposed him to become one of the greatest criminals of that period. And if this is 'banal' and even funny, if with the best will in the world one cannot extract any diabolical or demonic profundity from Eichmann, that is still far from calling it commonplace.",
    author: "Hannah Arendt",
    category: "Skepticism of Platonist formulations",
  },
  {
    id: "butler-gender-imitation",
    text: "...gender is a kind of imitation for which there is no original; in fact, it is a kind of imitation that produces the very notion of the original as an effect and consequence of the imitation itself...",
    author: "Judith Butler",
    category: "Skepticism of Platonist formulations",
  },
  {
    id: "murdoch-moral-facts",
    text: "...there are 'moral facts' in the sense of moral interpretations of situations where the moral concept in question determines what the situation is, and if the concept is withdrawn then we are not left with the same situation or the same facts. In short, if moral concepts are regarded as deep moral configurations of the world, rather than as lines drawn round separable factual areas, then there would be no facts 'behind them' for them to be erroneously defined in terms of.",
    author: "Iris Murdoch, Symposium Vision and Choice in Morality",
    category: "Skepticism of Platonist formulations",
  },
  {
    id: "schopenhauer-expectation",
    text: "We are always living in expectation of better things, at the same time we often repent and long to have the past back again. We look upon the present as something to be put up with while it lasts, and serving only as the way towards our goal. Hence most people, if they glance back when they have come to the end of life, will find that al along they have been living ad interim, they will be surprised to find that the veryt hing they disregarded and let slip by unenjoyed was jut in the life in the expectation of which they passed all their time.",
    author: "Arthur Schopenhauer",
    category: "Skepticism of Platonist formulations",
  },
  {
    id: "may-naturalism",
    text: "Now then, imagine the importance of a language or system of expressive signs whose function was not to tell us about things but to present them to us in the act of executing themselves. Art is just such a language; this is what art does. The esthetic object is inwardness as such – it is each thing as 'I'.",
    author: "Simon May",
    category: "Skepticism of Platonist formulations",
  },
  {
    id: "smith-ethics",
    text: "This, then, is the first feature of an immanent ethics: it replaces the notion of the transcendental subject with immanent modes of existence that are determined by their degrees of power and relations of affectivity. In his later works, Foucault suggested replacing the term 'subject' with the term 'subjectivation.'",
    author: "Daniel Smith, from Essays on Deleuze",
    category: "Skepticism of Platonist formulations",
  },
  {
    id: "deleuze-rationality",
    text: "It is not the slumber of reason that engenders monsters, but vigilant and insomniac rationality.",
    author: "Gilles Deleuze",
    category: "Skepticism of Platonist formulations",
  },
  {
    id: "sivan-victim",
    text: "The documentary tradition is one that gives voice to the victim. For a long time, I have wondered about the function of the victim and to what extent facing the victim is, in fact, a redeeming act. I would say it's almost a Christian situation, where you have a victim that is suffering for you [the spectator] and through his suffering he redeems the spectator and more: He says, you are human because you feel my suffering.",
    author: "Eyal Sivan, Against forgetting",
    category: "Skepticism of Platonist formulations",
  },
  {
    id: "sartre-choice",
    text: "He had to choose between those two. What could help him to choose? Could the Christian doctrine? No. Christian doctrine says: Act with charity, love your neighbour, deny yourself for others, choose the way which is hardest, and so forth. But which is the harder road? To whom does one owe the more brotherly love, the patriot or the mother?",
    author: "Jean-Paul Sartre",
    category: "Skepticism of Platonist formulations",
  },
  {
    id: "beauvoir-woman",
    text: "One is not born, but rather becomes, a woman.",
    author: "Simone de Beauvoir",
    category: "Skepticism of Platonist formulations",
  },
  {
    id: "swanton-happiness",
    text: "Thus in GM, Nietzsche contrasts two forms of happiness: that of the engaged active person 'bursting with strength' (GM, p. 23), and that of the passive powerless type for whom happiness is a disengaged escape: it is 'essentially a narcotic, an anaesthetic, rest, peace, 'sabbath' relaxation of the mind ... in short [it is] something passive!'",
    author: "Christine Swanton",
    category: "Skepticism of Platonist formulations",
  },
  {
    id: "beauvoir-infinity",
    text: "I am incapable of conceiving infinity, and yet I do not accept finity. I want this adventure that is the context of my life to go on without end.",
    author: "Simone de Beauvoir",
    category: "Skepticism of Platonist formulations",
  },
  {
    id: "arendt-evil",
    text: "Evil comes from a failure to think. It defies thought for as soon as thought tries to engage itself with evil and examine the premises and principles from which it originates, it is frustrated because it finds nothing there. That is the banality of evil.",
    author: "Hannah Arendt",
    category: "Skepticism of Platonist formulations",
  },
  {
    id: "lakatos-proof",
    text: "The virtue of a logical proof is not that it compels belief, but that it suggests doubts.",
    author: "Imre Lakatos",
    category: "Skepticism of Platonist formulations",
  },
  {
    id: "sartre-freedom",
    text: "Man is condemned to be free; because once thrown into the world, he is responsible for everything he does.",
    author: "Jean-Paul Sartre",
    category: "Skepticism of Platonist formulations",
  },
  {
    id: "smith-spinoza",
    text: "It is this distinction that allows Spinoza to introduce an 'ethical difference' between various types of modes of existence. In Spinoza, an individual will be considered 'bad' (or servile, or weak, or foolish) who remains cut off from its power of acting, who remains in a state of slavery or impotence; conversely, a mode of existence will be called 'good' (or free, or rational, or strong) that exercises its capacity for being affected in such a way that its power of acting increases, to the point where it produces active affections and adequate ideas.",
    author: "Daniel Smith, from Essays on Deleuze",
    category: "Skepticism of Platonist formulations",
  },
  // On computers, math, and formalization
  {
    id: "winograd-satisfaction",
    text: "Ultimately, then, satisfaction is determined not by the world but by a declaration on the part of the requestor that a condition is satisfied. The case of 'fit' may seem extreme, but every condition of satisfaction ultimately rests on a declaration by an individual, within the background of a community.",
    author: "Terry Winograd",
    category: "On computers, math, and formalization",
  },
  {
    id: "winograd-computers",
    text: "Computers are a tool for conducting the network of conversations.",
    author: "Terry Winograd",
    category: "On computers, math, and formalization",
  },
  {
    id: "farrell-models",
    text: "We now have technologies that can do for written and visual culture something like what prices do for economic information and bureaucratic categories do for social information. Large models generate representations of a vast and ungraspable whole that do not fully capture that whole but are manipulable and reproducible at scale.",
    author: "Henry Farrell",
    category: "On computers, math, and formalization",
  },
  {
    id: "mollick-bitter-lesson",
    text: "Instead of untangling every broken process, he just needs to define success and let AI navigate the mess. In fact, Bitter Lesson might actually be sweet: all those undocumented workflows and informal networks that pervade organizations might not matter. What matters is knowing good output when you see it.",
    author: "Ethan Mollick",
    category: "On computers, math, and formalization",
  },
  {
    id: "kleiner-ring-theory",
    text: "While with Fraenkel and Sono we witness the birth of the abstract ring concept, with Noether and Artin we see the birth of abstract ring theory. Noether and Artin made the abstract ring concept central in algebra by framing in an abstract setting the theorems which were its major inspirations.",
    author: "Isabelle Kleiner",
    category: "On computers, math, and formalization",
  },
  {
    id: "wattenberger-tools",
    text: "I want to see more tools and fewer operated machines - we should be embracing our humanity instead of blindly improving efficiency. And that involves using our new AI technology in more deft ways than generating more content for humans to evaluate.",
    author: "Amelia Wattenberger",
    category: "On computers, math, and formalization",
  },
  {
    id: "wilson-overfitting",
    text: "Bartlett et al. (2020) note 'the phenomenon of benign overfitting is one of the key mysteries uncovered by deep learning methodology: deep neural networks seem to predict well, even with a perfect fit to noisy training data.' However, benign overfitting behaviour can be reproduced with other model classes, can be understood intuitively, and is described by rigorous frameworks for characterizing generalization that have existed for decades.",
    author: "Andrew Gordon Wilson",
    category: "On computers, math, and formalization",
  },
  {
    id: "kleiner-hilbert",
    text: "Hilbert, who wrote a thesis on invariants in 1885, and in 1888 gave a much simpler, but noncomputational, proof of Gordan's result on binary forms, astonished the mathematical community in 1890 by showing that any form, of any degree, in any number of variables, has a basis. Hilbert adopted a new, conceptual, approach to the subject.",
    author: "Isabelle Kleiner",
    category: "On computers, math, and formalization",
  },
  // On immanence
  {
    id: "lonergan-intelligibility",
    text: "A genetic intelligibility is grasped by a direct insight into some single driving factor that keeps the development moving through developmental phases, such as found in developmental models of stars, plants, human intelligence, and human morality. A dialectical intelligibility is grasped by an inverse insight that there is no single driving factor that keeps the development moving.",
    author: "Bernard Lonergan",
    category: "On immanence",
  },
  {
    id: "murdoch-attention",
    text: "If we ignore the prior work of attention and notice only the emptiness of the moment of choice we are likely to identify freedom with the outward movement since there is nothing else to identify it with. But if we consider what the work of attention is like, how continuously it goes on, and how imperceptibly it builds up structures of value round about us, we shall not be surprised that at crucial moments of choice most of the business of choosing is already over.",
    author: "Iris Murdoch, The Sovereignty of Good",
    category: "On immanence",
  },
  {
    id: "winner-technologies",
    text: "Here we encounter an important quality in modern political discourse and in the way people commonly think about what measures are justified in response to the possibilities technologies make available. In many instances, to say that some technologies are inherently political is to say that certain widely accepted reasons of practical necessity—especially the need to maintain crucial technological systems as smoothly working.",
    author: "Langston Winner",
    category: "On immanence",
  },
  {
    id: "deleuze-meaning",
    text: "...But what we call the meaning of a statement is its point. That's the only definition of meaning, and it comes to the same thing as a statement's novelty. You can listen to people for hours, but what's the point? . . . That's why arguments are such a strain, why there's never any point arguing. You can't just tell someone what they're saying is pointless. So you tell them it's wrong. But what someone says is never wrong, the problem isn't that some things are wrong, but that they're stupid or irrelevant.",
    author: "Gilles Deleuze",
    category: "On immanence",
  },
  {
    id: "spinoza-persevere",
    text: "Each thing insofar as it is in itself, endeavours to persevere in its being.",
    author: "Baruch Spinoza",
    category: "On immanence",
  },
  {
    id: "murdoch-art",
    text: "These arts, especially literature and painting, show us the peculiar sense in which the concept of virtue is tied on to the human condition. They show us the absolute pointlessness of virtue while exhibiting its supreme importance; the enjoyment of art is a training in the love of virtue.",
    author: "Iris Murdoch",
    category: "On immanence",
  },
  {
    id: "feynman-fool",
    text: "The first principle is that you must not fool yourself—and you are the easiest person to fool. So you have to be very careful about that. After you've not fooled yourself, it's easy not to fool other scientists. You just have to be honest in a conventional way after that.",
    author: "Richard Feynman",
    category: "On immanence",
  },
  {
    id: "ortega-aesthetic",
    text: "Now then, imagine the importance of a language or system of expressive signs whose function was not to tell us about things but to present them to us in the act of executing themselves. Art is just such a language; this is what art does. The esthetic object is inwardness as such – it is each thing as 'I'.",
    author: "Ortega",
    category: "On immanence",
  },
  {
    id: "spinoza-struggle",
    text: "The more you struggle to live, the less you live. Give up the notion that you must be sure of what you are doing. Instead, surrender to what is real within you, for that alone is sure....you are above everything distressing.",
    author: "Baruch Spinoza",
    category: "On immanence",
  },
  {
    id: "murdoch-normative",
    text: "On my view it might be said that, per contra, the primary general words could be dispensed with entirely and all moral work could be done by the secondary specialized words. If we picture the agent as compelled by obedience to the reality he can see, he will not be saying 'This is right', i.e., 'I choose to do this', he will be saying 'This is A B C D' (normative-descriptive words), and action will follow naturally.",
    author: "Iris Murdoch, The Sovereignty of Good",
    category: "On immanence",
  },
  {
    id: "suchman-protocols",
    text: "Drawing on their respective studies of cardiopulmonary resuscitation (Timmermans 1999) and the administration of medical research protocols (Berg 1997), Timmermans and Berg argue that rather than evidence for a failure of procedures, or resistance on the part of those who are enrolled to carry them out, multiplicity is a requirement for a procedure or protocol's functioning as a standard.",
    author: "Lisa Suchman",
    category: "On immanence",
  },
  {
    id: "deleuze-stratum",
    text: "This is how it should be done: lodge yourself on a stratum, experiment with the opportunities it offers, find an advantageous place on it, find potential movements of deterritorialization, possible lines of flight, experience them, produce flow conjunctions here and there, try out continuums of intensities segment by segment, have a small plot of new land at all times.",
    author: "Gilles Deleuze",
    category: "On immanence",
  },
  {
    id: "suchman-plans",
    text: "I have argued that to treat a plan – or any other form of prescriptive representation – as a specification for a course of action shuts down precisely the space of inquiry that begs for investigation; that is, the relations between an ordering device and the contingent labors through which it is produced and made reflexively accountable to ongoing activity.",
    author: "Lisa Suchman",
    category: "On immanence",
  },
  {
    id: "kalai-examples",
    text: "The methods for coming up with useful examples in mathematics... are even less clear than the methods for proving mathematical statements.",
    author: "Gil Kalai",
    category: "On immanence",
  },
  {
    id: "deleuze-silence",
    text: "We sometimes go on as though people can't express themselves. In fact they're always expressing themselves. The sorriest couples are those where the woman can't be preoccupied or tired without the man saying 'What's wrong? Say something…,' or the man, without the woman saying … and so on. Radio and television have spread this spirit everywhere, and we're riddled with pointless talk, insane quantities of words and images. Stupidity's never blind or mute. So it's not a problem of getting people to express themselves but of providing little gaps of solitude and silence in which they might eventually find something to say.",
    author: "Gilles Deleuze, Negotiations",
    category: "On immanence",
  },
  {
    id: "sontag-interpretation",
    text: "In a culture whose already classical dilemma is the hypertrophy of the intellect at the expense of energy and sensual capability, interpretation is the revenge of the intellect upon art. Even more. It is the revenge of the intellect upon the world. To interpret is to impoverish, to deplete the world—in order to set up a shadow world of 'meanings.'",
    author: "Susan Sontag",
    category: "On immanence",
  },
  {
    id: "glanvill-omniscience",
    text: "Neither are we yet at so deplorable a loss, in the other parts of what we call Science; but that we may meet with what will content ingenuity, at this distance from perfection, though all things will not completely satisfy strict and rigid inquiry. Philosophy indeed cannot immortalize us, or free us from the inseparable attendants on this state, Ignorance and Error. But shall we malign it, because it entitles us not to an Omniscience?",
    author: "Glanvill",
    category: "On immanence",
  },
  {
    id: "sontag-erotics",
    text: "What is important now is to recover our senses. We must learn to see more, to hear more, to feel more. Our task is not to find the maximum amount of content in a work of art, much less to squeeze more content out of the work than is already there. Our task is to cut back content so that we can see the thing at all.",
    author: "Susan Sontag",
    category: "On immanence",
  },
  // Philosophy as reactive to real problems
  {
    id: "deleuze-encounter",
    text: "Something in the world forces us to think. This something is an object not of recognition but of a fundamental encounter. What is encountered may be Socrates, a temple or a demon. It may be grasped in a range of affective tones: wonder, love, hatred, suffering. In whichever tone, its primary characteristic is that it can only be sensed.",
    author: "Gilles Deleuze",
    category: "Philosophy as reactive to real problems",
  },
  {
    id: "smith-actual",
    text: "This difference between the present and the actual, for Deleuze, is much more important than the difference between the present and the past. The present is what we are, and for that reason, what we are already ceasing to be; the actual is not what we are, but rather what we are becoming, what we are in the process of becoming.",
    author: "Daniel Smith, from Essays on Deleuze",
    category: "Philosophy as reactive to real problems",
  },
  {
    id: "wimsatt-contingencies",
    text: "...Contrary to some philosophical views, 'empirical contingencies' are crucially important to philosophy. We are embodied socialized beings: evolved and developing in a world conditioned by our sociality and technology.",
    author: "William C. Wimsatt",
    category: "Philosophy as reactive to real problems",
  },
  {
    id: "hegel-owl",
    text: "the owl of Minerva spreads its wings only with the falling of the dusk",
    author: "Hegel",
    category: "Philosophy as reactive to real problems",
  },
  {
    id: "rabin-ecclesiastes",
    text: "To everything there is a season, and a time to every purpose under Heaven; a time to be born and a time to die; a time to kill and a time to heal; a time to weep and a time to laugh; a time to love and a time to hate; a time for war and a time of peace. Ladies and gentlemen, the time for peace has come.",
    author: "Yitzhak Rabin, quoting Kohelet / Ecclesiastes, at the 1993 Signing of the Oslo Accords",
    category: "Philosophy as reactive to real problems",
  },
  {
    id: "wilson-irregular",
    text: "Thus I believe that philosophers should fancy themselves as dedicated students of the irregular. But inherited fashions within our subject presently reward ersatz rigor and armchair pontification without encouraging the informed attention to detail and practical application upon which proper conceptual disentanglements characteristically depend.",
    author: "Mark Wilson",
    category: "Philosophy as reactive to real problems",
  },
  {
    id: "deleuze-sadden",
    text: "Philosophy does not serve the State or the Church, who have other concerns. It serves no established power. The use of philosophy is to sadden. A philosophy that saddens no one, that annoys no one, is not a philosophy. It is useful for harming stupidity, for turning stupidity into something shameful.",
    author: "Gilles Deleuze",
    category: "Philosophy as reactive to real problems",
  },
  {
    id: "haraway-connections",
    text: "...We also don't want to theorize the world, much less act within it, in terms of Global Systems, but we do need an earthwide network of connections, including the ability partially to translate knowledges among very different-and power-differentiated - communities.",
    author: "Donna Haraway, Situated Knowledges",
    category: "Philosophy as reactive to real problems",
  },
  {
    id: "murdoch-progress",
    text: "It is sometimes said, either irritably or with a certain satisfaction, that philosophy makes no progress. It is certainly true, and I think this is an abiding and not a regrettable characteristic of the discipline, that philosophy has in a sense to keep trying to return to the beginning: a thing which it is not at all easy to do.",
    author: "Iris Murdoch, The Sovereignty of Good",
    category: "Philosophy as reactive to real problems",
  },
  {
    id: "husserl-live",
    text: "I had to philosophize. Otherwise, I could not live in this world.",
    author: "Edmund Husserl, Cartesian Meditations",
    category: "Philosophy as reactive to real problems",
  },
  {
    id: "deleuze-foucault",
    text: "When Foucault admires Kant for having posed the problem of philosophy, not in relation to the eternal but in relation to the Now, he means that the object of philosophy is not to contemplate the eternal, nor to reflect on history, but to diagnose our actual becomings.",
    author: "Deleuze & Guattari, What is Philosophy?",
    category: "Philosophy as reactive to real problems",
  },
  {
    id: "latour-reactionary",
    text: "it is a common thing in political philosophy, that reactionary thinkers are more interesting than the progressive ones . . . in that you learn more about politics from people like Machiavelli and Schmitt than from Rousseau",
    author: "Bruno Latour",
    category: "Philosophy as reactive to real problems",
  },
  {
    id: "haraway-objectivity",
    text: "...We need to learn in our bodies, endowed with primate color and stereoscopic vision, how to attach the objective to our theoretical and political scanners in order to name where we are and are not, in dimensions of mental and physical space we hardly know how to name. So, not so perversely, objectivity turns out to be about particular and specific embodiment and definitely not about the false vision promising transcendence of all limits and responsibility.",
    author: "Donna Haraway, Situated Knowledges",
    category: "Philosophy as reactive to real problems",
  },
  {
    id: "murdoch-moral-concepts",
    text: "Great philosophers coin new moral concepts and communicate new moral visions and modes of understanding. [...] From here we may see that the task of moral philosophers has been to extend, as poets may extend, the limits of language, and enable it to illuminate regions which were formerly dark.",
    author: "Iris Murdoch",
    category: "Philosophy as reactive to real problems",
  },
  {
    id: "pundak-oslo",
    text: "We decided not to ignore the present or forget the past. We're trying to set them aside and figure out together, not how to make the past better but how to make the future better. So, we created a bubble. We aren't out of touch at all. Not from what happened to the Jews or the Arabs. Not from what is happening now. But, we're applying maximum force to try and get this process moving.",
    author: "Ron Pundak, Israeli negotiator in the 1992 Oslo Accords",
    category: "Philosophy as reactive to real problems",
  },
  {
    id: "harman-burden",
    text: "It has long been my view that since there are so many books one can read, and so many things that one can do besides read books, the burden is always on the author to make the topic at hand more interesting than all of these other options.",
    author: "Graham Harman",
    category: "Philosophy as reactive to real problems",
  },
  {
    id: "haraway-contingency",
    text: "So, I think my problem, and 'our' problem, is how to have simultaneously an account of radical historical contingency for all knowledge claims and knowing subjects, a critical practice for recognizing our own 'semiotic technologies' for making meanings, and a no-nonsense commitment to faithful accounts of a 'real' world, one that can be partially shared and that is friendly to earthwide projects of finite freedom, adequate material abundance, modest meaning in suffering, and limited happiness.",
    author: "Donna Haraway, Situated Knowledges",
    category: "Philosophy as reactive to real problems",
  },
  {
    id: "deleuze-minor-science",
    text: "Minor science is continually enriching major science, communicating its intuitions to it, its way of proceeding, its itinerancy, its sense of and taste for matter, singularity, variation, intuitionist geometry and the numbering number... Major science has a perpetual need for the inspiration of the minor; but the minor would be nothing if it did not confront and conform to the highest scientific requirements.",
    author: "Deleuze and Guattari, A Thousand Plateaus",
    category: "Philosophy as reactive to real problems",
  },
  {
    id: "deleuze-philosophy-art",
    text: "For me philosophy is an art of creation, much like music or painting. Philosophy creates concepts, which are neither generalities nor truths. They are more along the lines of the Singular, the Important, the New. Concepts are inseparable from affects, i.e., from the powerful effects they exert on our life, and percepts, i.e., the new ways of seeing or perceiving they provoke in us.",
    author: "Gilles Deleuze",
    category: "Philosophy as reactive to real problems",
  },
  {
    id: "hume-backgammon",
    text: "I dine, I play a game of backgammon, I converse, and am merry with my friends. And when, after three or four hours' amusement, I would return to these speculations, they appear so cold, and strained, and ridiculous, that I cannot find in my heart to enter into them any farther.",
    author: "David Hume",
    category: "Philosophy as reactive to real problems",
  },
  {
    id: "merleau-ponty-experience",
    text: "We know not through our intellect but through our experience.",
    author: "Maurice Merleau-Ponty",
    category: "Philosophy as reactive to real problems",
  },
  {
    id: "smith-infinitesimals",
    text: "Transfinites and infinitesimals are two types of infinite number, which characterize degrees of infinity in different fashions. In effect, this means that contemporary mathematics has 'two distinct rigorous formulations of the calculus': that of Weierstrass and Cantor, who eliminated infinitesimals, and that of Robinson, who rehabilitated and legitimized them.",
    author: "Daniel Smith",
    category: "Philosophy as reactive to real problems",
  },
  {
    id: "wimsatt-re-psychologize",
    text: "I want to re-psychologize, re-socialize, and re-embed us in the world, where we reason about that world as well as about how we interact with and reflect upon it. Can we still be recognizably philosophical while letting the subjects of 'philosophies of' shine through much more clearly and inspire new philosophies, rather than merely exporting our same old 'philosophical' disputes to these new territories?",
    author: "William C. Wimsatt",
    category: "Philosophy as reactive to real problems",
  },
  {
    id: "harman-ethics",
    text: "What formalism really means in Kantian ethics is an ethical purification that separates humans from the world. Ethics plays out entirely on the side of a human being's commitment to duty, to treating others as ends in themselves rather than solely as means, and in the end the world and its objects play no genuine ethical role.",
    author: "Graham Harman",
    category: "Philosophy as reactive to real problems",
  },
  {
    id: "husserl-philosophy",
    text: "...First, anyone who seriously intends to become a philosopher must 'once in his life' withdraw into himself and attempt, within himself, to overthrow and build anew all the sciences that, up to then, he has been accepting. Philosophy wisdom (sagesse) is the philosophizer's quite personal affair.",
    author: "Edmund Husserl, Cartesian Meditations",
    category: "Philosophy as reactive to real problems",
  },
  // Collective meaning systems
  {
    id: "smith-faith-labor",
    text: "What faith is to religion, labor is to political economy: humans produce gods in the same way they produce automobiles.",
    author: "Daniel Smith on Deleuze & Guattari's A Thousand Plateaus",
    category: "Collective meaning systems",
  },
  {
    id: "wimsatt-re-engineering",
    text: "Re-engineering is cumulative and is what makes our cumulative cultures possible. And any engineering project must be responsive to real world constraints, thus realism. Our social, cognitive, and cultural ways of being are no less real than the rest of the natural world, and all together leave their marks.",
    author: "William C. Wimsatt, Re-Engineering Philosophy for Limited Beings: Piecewise Approximations to Reality",
    category: "Collective meaning systems",
  },
  {
    id: "sellars-examine",
    text: "...examine these two ideas and determine how that which survives criticism in each is properly to be combined with the other...",
    author: "Wilfred Sellars",
    category: "Collective meaning systems",
  },
  {
    id: "wilson-cause",
    text: "In fact, the confusing behaviors of 'cause' strike me as similar in their developmental origins to those that attach to 'force,' which isn't altogether surprising due to the fact that the applicational demands upon the two words are closely linked.",
    author: "Mark Wilson",
    category: "Collective meaning systems",
  },
  {
    id: "sellars-looks",
    text: "...'looks' talk is not an autonomous language game - one that could be played though one played no other. It is entirely parasitic on the practice of making risky empirical reports of how things actually are.",
    author: "Wilfred Sellars",
    category: "Collective meaning systems",
  },
  {
    id: "feynman-cargo-cult",
    text: "I think the educational and psychological studies I mentioned are examples of what I would like to call Cargo Cult Science. In the South Seas there is a Cargo Cult of people. During the war they saw airplanes land with lots of good materials, and they want the same thing to happen now. So they've arranged to make things like runways, to put fires along the sides of the runways, to make a wooden hut for a man to sit in, with two wooden pieces on his head like headphones and bars of bamboo sticking out like antennas—he's the controller—and they wait for the airplanes to land. They're doing everything right. The form is perfect. It looks exactly the way it looked before. But it doesn't work. No airplanes land.",
    author: "Richard Feynman",
    category: "Collective meaning systems",
  },
  {
    id: "austin-abnormal",
    text: "...the abnormal will throw light on the normal, will help us to penetrate the blinding veil of ease and obviousness that hides the mechanisms of the natural successful act.",
    author: "J.L. Austin",
    category: "Collective meaning systems",
  },
  {
    id: "helmholtz-signs",
    text: "Thus although our sensations, as regards their quality, are only signs whose particular character depends wholly upon our own makeup, they are still not to be dismissed as a mere semblance, but they are precisely signs of something, be it something existing or happening, and — what is most important — they can form for us an image of the law of this thing which is happening.",
    author: "Hermann von Helmholtz",
    category: "Collective meaning systems",
  },
  {
    id: "mach-metaphysical",
    text: "We are accustomed to call concepts metaphysical if we have forgotten how we reached them. One can never lose one's footing, or come into collision with facts, if one always keeps in view the path by which one has come.",
    author: "Ernst Mach",
    category: "Collective meaning systems",
  },
  {
    id: "brandom-pragmatism",
    text: "Sellars's pragmatism dictates that issues of conceptual priority be translated into questions of the relative autonomy of different strata of language -that is, into questions concerning what language games can be played independently of and antecedently to which others.",
    author: "Robert Brandom",
    category: "Collective meaning systems",
  },
  {
    id: "lakatos-proofs",
    text: "...different proofs of the same naive conjecture lead to quite different theorems",
    author: "Imre Lakatos, from Proofs and Refutations",
    category: "Collective meaning systems",
  },
  {
    id: "murdoch-language",
    text: "Language is far more idiosyncratic than has been admitted. Reasons are not necessarily and qua reasons public. They may be reasons for a very few, and none the worse for that. 'I can't explain. You'd have to know her.' If the common object is lacking, communication may break down and the same words may occasion different results in different hearers.",
    author: "Iris Murdoch, The Sovereignty of Good",
    category: "Collective meaning systems",
  },
  {
    id: "sellars-rational-animal",
    text: "To say that man is a rational animal, is to say that man is a creature not of habits, but of rules. When God created Adam, he whispered in his ear, 'In all contexts of action you will recognize rules, if only the rule to grope for rules to recognize. When you cease to recognize rules, you will walk on four feet.'",
    author: "Wilfred Sellars",
    category: "Collective meaning systems",
  },
  {
    id: "lakatos-kappa",
    text: "KAPPA: But will they? What if God created polyhedra so that all true universal statements about them – formulated in human language – are infinitely long? Is it not blasphemous anthropomorphism to assume that (divine) true theorems are of finite length?",
    author: "Imre Lakatos, from Proofs and Refutations",
    category: "Collective meaning systems",
  },
  {
    id: "baldwin-books",
    text: "You think your pain and your heartbreak are unprecedented in the history of the world, but then you read. It was books that taught me that the things that tormented me most were the very things that connected me with all the people who were alive, who had ever been alive.",
    author: "James Baldwin",
    category: "Collective meaning systems",
  },
];

// Helper function to create a seeded random number generator
function seededRandom(seed: number) {
  return function() {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
  };
}

// Helper function to shuffle array deterministically (for consistent ordering each day)
export function shuffleArray<T>(array: T[]): T[] {
  // Use date as seed for deterministic shuffle (same order for the same day)
  const today = new Date();
  const seed = today.getFullYear() * 10000 + today.getMonth() * 100 + today.getDate();
  const random = seededRandom(seed);
  
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

