import { MoviesGetCreditsCast, MoviesGetCreditsCrew, TMDBNodeApi } from "tmdb-js-node";

const apiKey = process.env.TMDB_API_KEY || ""; // Set a default value if TMDB_API_KEY is undefined
const api = new TMDBNodeApi(apiKey);

export async function searchMovie(movie: string) {
    //String will be in the format of "The Matrix (1999)"
    const movieName = movie.split(" (")[0];
    const movieYear = movie.split(" (")[1].split(")")[0];

    const response = await api.v3.search.searchMovies({
        query: movieName,
        primary_release_year: movieYear
    });

    //Return the first result
    return response.results[0];
}

export async function getMovieCredits(movieId: number, difficulty: number = 1) {
    const credits = await api.v3.movies.getCredits(movieId);
    
    //get 10 cast members by difficulty (1: 1-10, 2: 11-20, 3: 21-30, etc)
    const cast = credits.cast.slice((difficulty - 1) * 10, difficulty * 10);
    //get the main crew
    const crew = credits.crew.filter(({ job }) => job === "Director" || job === "Writer" || job === "Director of Photography" || job.includes("Composer"));

    return { cast, crew }
}

export async function filterCredits({ cast, crew }: { cast: MoviesGetCreditsCast[], crew: MoviesGetCreditsCrew[] }, bannedPeople: number[] = []) {
    const filteredCast = cast.filter(({ id }) => !bannedPeople.includes(id));
    const filteredCrew = crew.filter(({ id }) => !bannedPeople.includes(id));

    return { cast: filteredCast, crew: filteredCrew }
}

export async function getAllRelatedMovies({ cast, crew }: { cast: MoviesGetCreditsCast[], crew: MoviesGetCreditsCrew[] }, difficulty: number = 1) {
    const cast_string = cast.map(({ id }) => id).join("|");
    //const crew_string = crew.map(({ id }) => id).join("|");

    const response = await api.v3.discover.movieDiscover({
        with_cast: cast_string,
        //with_crew: crew_string,
        page: 1
    });

    //first 25 results
    return response.results;
}

export async function getPersonId(person: string) {
    const people = await api.v3.search.searchPeople({
        query: person
    });

    return people.results[0].id;
}

export async function nextTurn(movieName: string, bannedPeople: number[], usedMovies: string[], difficulty: number = 1) {
    const movieId = (await searchMovie(movieName)).id;
    const credits = await getMovieCredits(movieId, difficulty);
    const filteredCredits = await filterCredits(credits, bannedPeople);
    const relatedMovies = await getAllRelatedMovies(filteredCredits, difficulty);
    var movieList: string[] = [];

    for (let movie of relatedMovies) {
        const movieString = `${movie.title} (${movie.release_date.split('-')[0]})`;
        if (!usedMovies.includes(movieString)) {
            movieList.push(movieString);
        }
    }

    return movieList;
}