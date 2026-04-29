import { Application, Router } from "@oak/oak";
import { oakCors } from "@tajpouria/cors";
import routeStaticFilesFrom "./util/routeStaticFilesFrom.ts";
import data from "./data.json" with { type: "json" };

const kv = await Deno.openKv();
const FAVORITES_KEY = ["favorites"];

async function getFavorites(): Promise<string[]> {
    const entry = await kv.get<string[]>(FAVORITES_KEY);
    return entry.value ?? [];
}

async function setFavorites(favorites: string[]): Promise<void> {
    await kv.set(FAVORITES_KEY, favorites);
}

async function isFavorite(dinosaurName: string): Promise<boolean> {
    const favorites = await getFavorites();
    return favorites.some(fav => 
        fav.toLowerCase() === dinosaurName.toLowerCase()
    );
}

export const app = new Application();
const router = new Router();

router.get("/api/dinosaurs", (context) => {
    context.response.body = data;
});

router.get("/api/dinosaurs/:dinosaur", (context) => {
    if (!context?.params?.dinosaur) {
        context.response.body = "No dinosaur name provided.";
    }

    const dinosaur = data.find((item) =>
        item.name.toLowerCase() === context.params.dinosaur.toLowerCase()
    );

    context.response.body = dinosaur ?? "No dinosaur found.";
});

router.get("/api/favorites", async (context) => {
    const favorites = await getFavorites();
    const favoriteDinosaurs = data.filter(dino => 
        favorites.some(fav => fav.toLowerCase() === dino.name.toLowerCase())
    );
    context.response.body = favoriteDinosaurs;
});

router.get("/api/favorites/:dinosaur", async (context) => {
    const dinosaurName = context.params.dinosaur;
    const favorite = await isFavorite(dinosaurName);
    context.response.body = { isFavorite: favorite };
});

router.post("/api/favorites/:dinosaur", async (context) => {
    const dinosaurName = context.params.dinosaur;
    const dinosaur = data.find((item) =>
        item.name.toLowerCase() === dinosaurName.toLowerCase()
    );

    if (!dinosaur) {
        context.response.status = 404;
        context.response.body = { error: "Dinosaur not found" };
        return;
    }

    const favorites = await getFavorites();
    const alreadyFavorite = favorites.some(fav => 
        fav.toLowerCase() === dinosaurName.toLowerCase()
    );

    if (!alreadyFavorite) {
        favorites.push(dinosaur.name);
        await setFavorites(favorites);
    }

    context.response.body = { isFavorite: true, dinosaur: dinosaur.name };
});

router.delete("/api/favorites/:dinosaur", async (context) => {
    const dinosaurName = context.params.dinosaur;
    const favorites = await getFavorites();
    
    const newFavorites = favorites.filter(fav => 
        fav.toLowerCase() !== dinosaurName.toLowerCase()
    );
    
    await setFavorites(newFavorites);
    
    context.response.body = { isFavorite: false, dinosaur: dinosaurName };
});

app.use(oakCors());
app.use(router.routes());
app.use(router.allowedMethods());
app.use(routeStaticFilesFrom([
    `${Deno.cwd()}/dist`,
    `${Deno.cwd()}/public`,
]));

if (import.meta.main) {
    console.log("Server listening on port http://localhost:8000");
    await app.listen({ port: 8000 });
}
