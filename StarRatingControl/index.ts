import {IInputs, IOutputs} from "./generated/ManifestTypes";

// Интерфейс для хранения значений свойств из манифеста
interface IStarRatingProps {
    RatingValue: number | null;
    CommentText: string | null;
    MaxRating: number | null;
    StarColor: string | null;
    EmptyStarColor: string | null;
}

export class StarRatingControl implements ComponentFramework.StandardControl<IInputs, IOutputs> {

    // --- Глобальные переменные компонента ---
    private _container: HTMLDivElement;
    private _context: ComponentFramework.Context<IInputs>;
    private _props: IStarRatingProps = {
        RatingValue: 0,
        CommentText: null,
        MaxRating: 5,
        StarColor: "#FFC107",
        EmptyStarColor: "#e0e0e0"
    };
    private _notifyOutputChanged: () => void; // Функция для отправки данных обратно в Power Apps

    // Элементы UI
    private _starContainer: HTMLDivElement;
    private _commentContainer: HTMLDivElement;

    // Внутреннее состояние
    private _currentRating: number;
    private _hoverRating: number;
    private _isInteractive: boolean;

    // SVG-код для иконки звезды (чтобы не зависеть от внешних шрифтов)
    // (ИСПРАВЛЕНИЕ 1: Удалено ": string" )
    private _starSVG = `<svg viewBox="0 0 24 24" class="star-svg" xmlns="http://www.w3.org/2000/svg"><path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21 12 17.27z"/></svg>`;

    /**
     * (ИСПРАВЛЕНИЕ 2: Пустой конструктор удален)
     */
    
    /**
     * Вызывается при инициализации компонента.
     * Здесь мы создаем базовую HTML-структуру.
     */
    public init(context: ComponentFramework.Context<IInputs>, notifyOutputChanged: () => void, state: ComponentFramework.Dictionary, container:HTMLDivElement): void
    {
        this._context = context;
        this._container = container;
        this._notifyOutputChanged = notifyOutputChanged; // Сохраняем функцию обратного вызова

        // Создаем основной контейнер-обертку
        const wrapper = document.createElement("div");
        wrapper.className = "star-rating-wrapper";

        // Создаем контейнер для звезд
        this._starContainer = document.createElement("div");
        this._starContainer.className = "star-container";

        // Создаем контейнер для комментария
        this._commentContainer = document.createElement("div");
        this._commentContainer.className = "comment-container";

        // Собираем все вместе
        wrapper.appendChild(this._starContainer);
        wrapper.appendChild(this._commentContainer);
        this._container.appendChild(wrapper);
    }

    /**
     * Отрисовывает звезды на основе текущего состояния (выбранный рейтинг, рейтинг при наведении)
     */
    private _renderStars(): void {
        this._starContainer.innerHTML = ""; // Очищаем старые звезды

        // Определяем, какой рейтинг сейчас нужно показать (приоритет у наведения)
        const displayRating = this._hoverRating > 0 ? this._hoverRating : this._currentRating;
        
        for (let i = 1; i <= this._props.MaxRating!; i++) {
            const starSpan = document.createElement("span");
            
            const isFilled = i <= displayRating;
            const starColor = isFilled ? this._props.StarColor : this._props.EmptyStarColor;

            // Вставляем SVG с нужным цветом
            starSpan.innerHTML = this._starSVG;
            const svgElement = starSpan.querySelector("svg path") as SVGPathElement;
            if(svgElement) {
                svgElement.style.fill = starColor!;
            }

            // --- ДОБАВЛЕНИЕ ИНТЕРАКТИВНОСТИ ---
            // Добавляем обработчики, только если компонент не отключен
            if (this._isInteractive) {
                // Обработчик наведения мыши
                starSpan.addEventListener("mouseover", () => this._onStarMouseOver(i));
                // Обработчик клика
                starSpan.addEventListener("click", () => this._onStarClick(i));
            }
            // --- КОНЕЦ ИНТЕРАКТИВНОСТИ ---

            this._starContainer.appendChild(starSpan);
        }
    }

    // --- ОБРАБОТЧИКИ СОБЫТИЙ ---

    private _onStarMouseOver(rating: number): void {
        this._hoverRating = rating;
        this._renderStars(); // Перерисовываем звезды
    }

    private _onStarMouseOut(): void {
        this._hoverRating = 0;
        this._renderStars(); // Перерисовываем звезды
    }

    private _onStarClick(rating: number): void {
        this._currentRating = rating; // Устанавливаем выбранный рейтинг
        this._notifyOutputChanged(); // Уведомляем Power Apps об изменении
    }

    /**
     * Вызывается при обновлении любого из входных свойств (properties).
     * Здесь мы перерисовываем компонент.
     */
    public updateView(context: ComponentFramework.Context<IInputs>): void
    {
        // Получаем актуальные значения из Power Apps
        this._props.RatingValue = context.parameters.RatingValue.raw;
        this._props.CommentText = context.parameters.CommentText.raw;
        this._props.MaxRating = context.parameters.MaxRating.raw || 5; 
        this._props.StarColor = context.parameters.StarColor.raw || "#FFC107";
        this._props.EmptyStarColor = "#e0e0e0"; 

        // Проверяем, отключен ли компонент (например, в режиме Read-Only)
        this._isInteractive = !context.mode.isControlDisabled;

        // Устанавливаем текущий рейтинг
        this._currentRating = this._props.RatingValue || 0;
        this._hoverRating = 0; // Сбрасываем рейтинг при наведении

        // Добавляем/убираем класс интерактивности для CSS
        if(this._isInteractive) {
            this._starContainer.classList.add("interactive");
            // Добавляем общий обработчик ухода мыши
            this._starContainer.addEventListener("mouseout", () => this._onStarMouseOut());
        } else {
            this._starContainer.classList.remove("interactive");
        }

        // --- 1. Отрисовка Звезд ---
        this._renderStars();

        // --- 2. Отрисовка Комментария ---
        if (this._props.CommentText && this._props.CommentText.trim().length > 0) {
            this._commentContainer.innerText = this._props.CommentText;
            this._commentContainer.style.display = "block";
        } else {
            this._commentContainer.innerText = "";
            this._commentContainer.style.display = "none";
        }
    }

    /**
     * Возвращает измененные значения обратно в Power Apps.
     */
    public getOutputs(): IOutputs
    {
        // Отправляем обратно только измененный RatingValue
        return {
            RatingValue: this._currentRating
        };
    }

    /**
     * Вызывается при удалении компонента.
     */
    public destroy(): void
    {
        // Очищаем DOM и удаляем обработчики
        this._container.innerHTML = "";
    }
}