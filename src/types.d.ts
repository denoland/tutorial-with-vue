type Dinosaur = {
    name: string;
    description: string;
};

type ComponentData = {
    dinosaurDetails: null | Dinosaur;
    isFavorite: boolean;
    isLoading: boolean;
};
