export interface TravelQuote {
  text: string
  author: string
}

export const TRAVEL_QUOTES: TravelQuote[] = [
  { text: 'Not all those who wander are lost.', author: 'J.R.R. Tolkien' },
  { text: 'The world is a book, and those who do not travel read only one page.', author: 'Saint Augustine' },
  { text: 'Travel is the only thing you buy that makes you richer.', author: 'Anonymous' },
  { text: 'Adventure is worthwhile in itself.', author: 'Amelia Earhart' },
  { text: 'To travel is to live.', author: 'Hans Christian Andersen' },
  { text: 'Life is either a daring adventure or nothing at all.', author: 'Helen Keller' },
  { text: 'Travel makes one modest — you see what a tiny place you occupy in the world.', author: 'Gustave Flaubert' },
  { text: 'The journey of a thousand miles begins with a single step.', author: 'Lao Tzu' },
  { text: 'Twenty years from now you will be more disappointed by the things you didn\'t do than by the ones you did.', author: 'Mark Twain' },
  { text: 'A good traveller has no fixed plans and is not intent on arriving.', author: 'Lao Tzu' },
  { text: 'Travel far enough, you meet yourself.', author: 'David Mitchell' },
  { text: 'The real voyage of discovery consists not in seeking new landscapes, but in having new eyes.', author: 'Marcel Proust' },
  { text: 'Once a year, go somewhere you have never been before.', author: 'Dalai Lama' },
  { text: 'Travelling — it leaves you speechless, then turns you into a storyteller.', author: 'Ibn Battuta' },
  { text: 'I haven\'t been everywhere, but it\'s on my list.', author: 'Susan Sontag' },
  { text: 'We travel not to escape life, but for life not to escape us.', author: 'Anonymous' },
  { text: 'The world is big, and I want to have a good look at it before it gets dark.', author: 'John Muir' },
  { text: 'Jobs fill your pocket. Adventures fill your soul.', author: 'Jaime Lyn Beatty' },
  { text: 'Wherever you go, go with all your heart.', author: 'Confucius' },
  { text: 'To move, to breathe, to fly, to float — to gain all while you give.', author: 'Kahlil Gibran' },
  { text: 'A mind that is stretched by a new experience can never go back to its old dimensions.', author: 'Oliver Wendell Holmes' },
  { text: 'The traveller sees what he sees; the tourist sees what he has come to see.', author: 'G.K. Chesterton' },
  { text: 'Perhaps travel cannot prevent bigotry, but by demonstrating that all peoples cry, laugh, eat, worry, and die, it can introduce the idea that if we try and understand each other, we may even become friends.', author: 'Maya Angelou' },
  { text: 'One\'s destination is never a place, but always a new way of seeing things.', author: 'Henry Miller' },
  { text: 'Not I, not anyone else, can travel that road for you. You must travel it for yourself.', author: 'Walt Whitman' },
  { text: 'To awaken quite alone in a strange town is one of the pleasantest sensations in the world.', author: 'Freya Stark' },
  { text: 'I travel because it makes me realise how much I haven\'t seen, how much I\'m not going to see.', author: 'Mark Jenkins' },
  { text: 'A ship in harbour is safe, but that is not what ships are built for.', author: 'John A. Shedd' },
  { text: 'All journeys have secret destinations of which the traveller is unaware.', author: 'Martin Buber' },
  { text: 'The gladdest moment in human life is a departure into unknown lands.', author: 'Richard Burton' },
  { text: 'Man cannot discover new oceans unless he has the courage to lose sight of the shore.', author: 'André Gide' },
]

export function getDailyQuote(): TravelQuote {
  const dayOfYear = Math.floor(
    (Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86_400_000,
  )
  return TRAVEL_QUOTES[dayOfYear % TRAVEL_QUOTES.length]
}
