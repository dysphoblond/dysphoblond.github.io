# dysphoblond portfolio

**Your Potential** — портфолио дизайнера и фронтенд-разработчика dysphoblond: плакаты, дизайн постов, сайты, лендинги и Telegram-боты.

**Сайт:** https://dysphoblond.github.io/

## Что внутри

- **Обложка** — пиксельный постер с живыми облаками и логотипом; слово после «Your» сменяется (Design, Sites, Bots, Landings…). Нажми на крюк — логотип вспыхнет, и страница уедет к работам.
- **Плакаты и дизайн постов** — превью на главной и [галерея](https://dysphoblond.github.io/gallery.html) со всеми работами.
- **Проекты**
  - [Ears of God](https://dysphoblond.github.io/projects/dysph-audio/) — концепт-лендинг мастерской hi-end колонок: сцены моделей на весь экран, интерактивный разрез, график АЧХ, карта залов.
  - [Кольцо+ Architecture](https://dysphoblond.github.io/projects/dysph-house/) — лендинг бюро загородных домов.
  - [placats-lab](https://dysphoblond.github.io/projects/placats-lab/) — генератор постеров в браузере.
  - Telegram-боты — финансовый трекер и магазин постеров Placats shop (код ботов в этот репозиторий не входит).
- **Бонус** — мини-игра Dyspphy fly.
- **Контакты** — почта, Kwork, Telegram и соцсети.

Есть переключатель RU / EN и кнопка FX, которая выключает анимации.

## Стек

HTML, CSS и JavaScript без фреймворков и сборки. Canvas для пиксельной анимации, SVG для графики.

## Запуск локально

```
python -m http.server
```

и открыть http://localhost:8000. Пиксельная анимация обложки читает картинку через canvas, поэтому работает только через сервер, а не при открытии файла с диска.

## Авторы изображений

- Фото колонок на лендинге Ears of God — [Unsplash](https://unsplash.com/license): Aleksandrs Zeltisevs, Tawshif Khan, Chanhee Lee, wu yi.
- Картина в разделе «Сделано в Петербурге» — Алексей Боголюбов, 1884.

Остальные работы и графика — © dysphoblond.
