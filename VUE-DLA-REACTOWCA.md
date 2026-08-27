# Vue 3 dla kogoś, kto pisze w Reakcie

Ściąga pod rozmowę techniczną. Każdy punkt ma odnośnik do **konkretnej linii w tym repo** —
na pytanie „a jak to zrobiłeś?" pokazujesz plik, nie teorię.

---

## 1. Reaktywność — `ref` i `reactive`

W Reakcie stan deklarujesz przez `useState` i dostajesz parę [wartość, setter].
We Vue deklarujesz **pudełko**, które samo wie, kiedy się zmieniło.

```ts
const licznik = ref(0)     // pudełko na wartość
licznik.value++            // w <script> ZAWSZE przez .value
```

```vue
<p>{{ licznik }}</p>       <!-- w szablonie .value jest dopisywane automatycznie -->
```

- **`ref`** — działa na wszystkim: liczby, stringi, obiekty, tablice. **Domyślnie używaj `ref`.**
- **`reactive`** — tylko obiekty i tablice, bez `.value`, ale **traci reaktywność przy
  destrukturyzacji** i nie da się go podmienić w całości. Dlatego w tym repo nie ma go wcale.

**Pytanie, które padnie:** *„`ref` czy `reactive`?"*
Odpowiedź: `ref`, bo jest jednolity i przeżywa podmianę całej wartości.
`reactive` kusi brakiem `.value`, ale rozsypuje się przy `const { a } = obiekt`.

📍 `src/stores/alerts.ts` — cały stan store'a to `ref`.

---

## 2. `computed` — to nie jest `useMemo`

```ts
const uzbrojone = computed(() => pozycje.value.filter(a => a.status === 'armed').length)
```

Różnica wobec Reacta: **nie ma tablicy zależności**. Vue śledzi, z czego korzystałeś
w środku, i przelicza tylko wtedy, gdy to coś się zmieni. Wynik jest cache'owany.

**Pytanie:** *„czym się różni `computed` od zwykłej funkcji w szablonie?"*
Funkcja wykonuje się przy **każdym** renderze. `computed` tylko wtedy, gdy zmieniła się
zależność — i pamięta poprzedni wynik.

📍 `src/stores/alerts.ts` — `uzbrojone`, `pusto`, `jestNastepna`
📍 `src/components/AlertForm.vue` — `bledy` i `podglad` przeliczają się z pól formularza

---

## 3. `watch` kontra `watchEffect`

```ts
watch(ticker, () => { /* reaguj na zmianę tickera */ })       // jawne źródło
watch([tryb, baseUrl, apiKey], zapisz)                        // kilka źródeł naraz
watchEffect(() => { console.log(ticker.value) })              // źródła wykrywane same
```

- `watch` — mówisz **na co** patrzysz. Dostajesz starą i nową wartość. Nie odpala się na starcie
  (chyba że `{ immediate: true }`).
- `watchEffect` — odpala się od razu i sam zbiera zależności. Wygodne, ale łatwiej o przypadkowe
  wywołanie.

Odpowiednik `useEffect`, ale **bez tablicy zależności i bez pułapki nieaktualnego domknięcia**.

📍 `src/components/FilterBar.vue` — `watch` z debounce na polu tekstowym i natychmiastowy
   na listach rozwijanych. Uzasadnienie różnicy jest w komentarzu.
📍 `src/stores/settings.ts` — `watch` na trzech `ref`ach zapisuje ustawienia do `localStorage`.

---

## 4. Cykl życia

| React | Vue 3 |
|---|---|
| `useEffect(fn, [])` | `onMounted(fn)` |
| funkcja sprzątająca z `useEffect` | `onUnmounted(fn)` |
| `useEffect(fn)` bez tablicy | `onUpdated(fn)` (rzadko potrzebne) |

📍 `src/views/AlertsView.vue` — `onMounted(store.pobierz)`

---

## 5. Props i zdarzenia

```ts
const props = defineProps<{ status: AlertStatus }>()      // typowane, bez importu
const emit = defineEmits<{ zapisz: [dane: AlertCreate] }>()
emit('zapisz', dane)
```

Rodzic podpina się przez `@zapisz="obsluga"`, a nie przez props z funkcją.
**Dane w dół przez props, zdarzenia w górę przez emit** — props są tylko do odczytu.

📍 `src/components/AlertForm.vue` (emit) i `src/views/AlertsView.vue` (`@zapisz="zapisz"`)

---

## 6. `v-model` — dwukierunkowe wiązanie

```vue
<input v-model="ticker" />
```

To skrót na `:value="ticker"` + `@input="ticker = $event.target.value"`.
W Reakcie piszesz to ręcznie za każdym razem; tu jest jedna dyrektywa.

Na komponencie własnym `v-model` opiera się o props `modelValue` i zdarzenie
`update:modelValue`.

📍 Cały `src/components/AlertForm.vue` i `src/views/SettingsView.vue`
   (tam `v-model` na `radio` przełącza tryb API)

---

## 7. Dyrektywy w szablonie

| Vue | React |
|---|---|
| `v-if` / `v-else-if` / `v-else` | `{warunek && <X/>}` — ale `v-if` **usuwa z DOM** |
| `v-show` | `style={{display:'none'}}` — element zostaje w DOM |
| `v-for="x in lista" :key="x.id"` | `lista.map(x => <X key={x.id}/>)` |
| `@click="fn"` | `onClick={fn}` |
| `@submit.prevent="fn"` | `onSubmit={e => {e.preventDefault(); fn()}}` |
| `:class="{ aktywny: warunek }"` | `className={warunek ? 'aktywny' : ''}` |

**Uwaga na pytanie:** `v-if` i `v-for` na tym samym elemencie to antywzorzec —
`v-if` ma niższy priorytet i wykona się dla każdej iteracji.

---

## 8. Pinia kontra zustand

Pinia to **odpowiednik zustanda**, którego już używasz w PORTFOLIOV2 i Alphatronie —
nie Reduxa. Store w stylu setup wygląda dokładnie jak komponent:

```ts
export const useAlertsStore = defineStore('alerts', () => {
  const pozycje = ref<Alert[]>([])                    // stan
  const uzbrojone = computed(() => /* ... */)         // getter
  async function pobierz() { /* ... */ }              // akcja
  return { pozycje, uzbrojone, pobierz }
})
```

Bez reducerów, bez akcji jako obiektów, bez `dispatch`. Akcje mogą być `async`
bez żadnego middleware — to jest największa różnica wobec Reduxa.

**Pułapka, o którą pytają:**

```ts
const { pozycje } = store              // ❌ zrywa reaktywność
const { pozycje } = storeToRefs(store) // ✅ zachowuje
store.pobierz()                        // ✅ akcje bierzemy wprost, bez storeToRefs
```

📍 `src/stores/alerts.ts`, użycie w `src/views/AlertsView.vue` — komentarz przy `storeToRefs`
   tłumaczy dokładnie ten problem.

---

## 9. `<script setup>`

Cały kod to ciało funkcji `setup()`. Nie ma `this`, nie ma `return`, nie ma sekcji
`data`/`methods`/`computed` z Options API. Wszystko zadeklarowane na górze jest widoczne
w szablonie. Komponenty importujesz i używasz — bez rejestracji w `components: {}`.

To jest nowoczesny sposób pisania Vue 3 i jedyny, którego używam w tym repo.

---

## 10. Czego tu świadomie NIE ma

Warto umieć powiedzieć, czego się nie użyło i dlaczego:

- **Options API** — starszy styl (`data()`, `methods`). Vue 3 go wspiera, ale nowy kod pisze
  się w Composition API.
- **Vuex** — poprzednik Pinii, oficjalnie odradzany w nowych projektach.
- **Nuxt** — framework nad Vue (SSR, routing z plików). Tutaj niepotrzebny, bo to SPA.
- **`reactive`** — powody w punkcie 1.

---

## Pytania kontrolne — sprawdź się przed rozmową

1. Dlaczego `ref` a nie `reactive`?
2. Co robi `storeToRefs` i co się dzieje bez niego?
3. Czym `computed` różni się od funkcji wywołanej w szablonie?
4. Kiedy `watch`, a kiedy `watchEffect`?
5. Na czym polega `v-model` pod spodem?
6. Dlaczego `v-if` razem z `v-for` na jednym elemencie to zły pomysł?
7. Czym Pinia różni się od Reduxa? (podpowiedź: akcje async bez middleware)
8. Co to jest `<script setup>` i co upraszcza?
9. Jak dziecko przekazuje dane rodzicowi?
10. `v-if` czy `v-show` — kiedy które?
