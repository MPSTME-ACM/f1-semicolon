const rawText = `
acm the thriving hub of innovators thinkers and creators offers an environment that nurtures growth exploration and innovation
here students dive into the evolving world of computing through hands on experiences stimulating competitions and avenues for creative expression
at our core we strive to bridge the gap between academic knowledge and real world tech applications
we aim to empower passionate minds who will one day shape the digital future and enable them to fly high with acm

brief description of our events
acm mpstme hosts a series of signature events designed to engage students across all technical levels from beginners stepping into the world of programming to seasoned coders eager to test their limits
these events aim to build a collaborative skill driven and innovation focused community
heres a look at our core offerings

semicolon is acm mpstmes annual introductory event that marks the beginning of a new term
held offline it serves as a welcoming platform for first year students to explore the committees departments understand their unique roles and learn about ongoing initiatives
through interactive presentations department showcases and open floor discussions participants gain insights into how the committee operates be it technical development media outreach or content
the event fosters curiosity and encourages students to ask questions helping them identify where their interests align and how they can contribute meaningfully
semicolon isnt just an orientation its an invitation to be part of a dynamic community driven by passion for technology creativity and growth
programming for everyone
no skills no problem
we build them here
programming for everyone is a beginner friendly offline workshop series curated to introduce students to the fundamentals of programming in an accessible and hands on manner
spanning across three days the event covers key languages like python c++ and essentials of web development using html css javascript git and github
the sessions are led by acms student mentors creating a more relatable and approachable learning environment
participants engage in live coding collaborative tasks and mini projects that enhance both understanding and confidence
the workshop culminates in a capstone project where students apply their learning in a practical setting often developing simple games websites or tools
whether youre touching code for the first time or strengthening your basics pfe ensures that everyone walks away with tangible skills and a deeper interest in programming
semicode is acm mpstmes premier competitive coding event open to college students across the city
the event challenges participants with algorithmic problem solving in a high stakes multi round format designed to test both individual skills and team synergy
teams typically consist of two members and compete across online and offline rounds that grow in complexity
the event supports a wide range of programming languages and encourages students to showcase their logic speed and strategic thinking
what sets semicode apart is its unique final round structure combining solo rounds with collaborative problem solving which emphasizes not only coding prowess but also communication and teamwork under pressure
its more than a competition its a celebration of problem solving peer learning and pushing boundaries
`;

// Function to split a long text into chunks of a desired length
function splitText(text: string, maxLength: number): string[] {
    const words = text.trim().replace(/\s+/g, ' ').split(' ');
    const chunks: string[] = [];
    let currentChunk = "";

    for (const word of words) {
        if ((currentChunk + " " + word).length > maxLength) {
            chunks.push(currentChunk.trim() + '.');
            currentChunk = word;
        } else {
            currentChunk = currentChunk ? `${currentChunk} ${word}` : word;
        }
    }
    if (currentChunk) {
        chunks.push(currentChunk.trim() + '.');
    }

    return chunks.filter(chunk => chunk.length > 50); // Filter out very short remnants
}

export const TEXT_SAMPLES = splitText(rawText, 250);