# SOL Teens — серверная часть (Google Apps Script)

Интерфейс живёт в папке `app/` этого репозитория и открывается по адресу https://teensparty.fun/app/
(QR для новеньких — https://teensparty.fun/app/join/). Любой пуш в `main` выкатывает его за ~1 минуту.

Здесь лежит копия серверного кода, который работает в проекте Apps Script «SOL Teens»
(привязан к таблице «SOL Teens — база»). Данные хранятся только в таблице, в репозитории их нет.

- `Code.gs` — API: вход лидеров по коду из почты, отметки, подростки, группы, задания, ачивки, QR.
- Фронтенд обращается к серверу через `POST {fn, args}` на адрес публикации (`doPost`).
- Адрес публикации (не меняется при обновлениях):
  https://script.google.com/macros/s/AKfycbw1J4PnxNLtZ8H8dCWhJpTiAeA2V-X5RWmJdB6VQPr_IFzemiKS-y_SW50PvR0dAnL6Cg/exec

Обновление сервера: заменить код в Apps Script → Deploy → Manage deployments → ✎ → Version: New version → Deploy
(ссылка остаётся прежней).
