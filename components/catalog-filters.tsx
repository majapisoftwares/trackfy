type CatalogFiltersProps = {
  values: Record<string, string | undefined>;
  showMediaTypeFilter?: boolean;
};

const currentYear = new Date().getFullYear();

export function CatalogFilters({
  values,
  showMediaTypeFilter = false,
}: CatalogFiltersProps) {
  return (
    <form className="catalog-filter-bar" method="get">
      <div className="catalog-filter-group">
        {showMediaTypeFilter && (
          <label className="catalog-select">
            <span className="sr-only">Tipo de conteúdo</span>
            <select name="mediaType" defaultValue={values.mediaType ?? ""}>
              <option value="">Tipo</option>
              <option value="movie">Filmes</option>
              <option value="tv">Séries</option>
            </select>
          </label>
        )}
        <label className="catalog-select">
          <span className="sr-only">Gênero</span>
          <select name="genre" defaultValue={values.genre ?? ""}>
            <option value="">Gênero</option>
            <option value="28">Ação</option>
            <option value="12">Aventura</option>
            <option value="35">Comédia</option>
            <option value="18">Drama</option>
            <option value="27">Terror</option>
            <option value="878">Ficção científica</option>
          </select>
        </label>
        <label className="catalog-select">
          <span className="sr-only">Ano</span>
          <select name="year" defaultValue={values.year ?? ""}>
            <option value="">Ano</option>
            {Array.from({ length: 10 }, (_, index) => currentYear - index).map(
              (year) => (
                <option value={year} key={year}>
                  {year}
                </option>
              ),
            )}
          </select>
        </label>
        <label className="catalog-select">
          <span className="sr-only">Avaliação mínima</span>
          <select name="rating" defaultValue={values.rating ?? ""}>
            <option value="">Avaliação</option>
            <option value="8">8 ou mais</option>
            <option value="7">7 ou mais</option>
            <option value="6">6 ou mais</option>
          </select>
        </label>
        <label className="catalog-select">
          <span className="sr-only">Idioma original</span>
          <select name="language" defaultValue={values.language ?? ""}>
            <option value="">Idioma</option>
            <option value="pt">Português</option>
            <option value="en">Inglês</option>
            <option value="es">Espanhol</option>
            <option value="ja">Japonês</option>
            <option value="ko">Coreano</option>
          </select>
        </label>
      </div>
      <div className="catalog-sort-group">
        <label className="catalog-select catalog-sort">
          <span>Ordenar por:</span>
          <select name="sort" defaultValue={values.sort ?? "popularity.desc"}>
            <option value="popularity.desc">Mais populares</option>
            <option value="vote_average.desc">Melhor avaliados</option>
            <option value="date.desc">Mais recentes</option>
          </select>
        </label>
        <button className="catalog-filter-submit" type="submit">
          Aplicar
        </button>
      </div>
    </form>
  );
}
