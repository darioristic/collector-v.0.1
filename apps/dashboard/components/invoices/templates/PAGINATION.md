# A4 Paginacija za pregled računa

Algoritam deli stavke na strane prema kapacitetu A4 stranice. Parametri su podesivi i omogućavaju preciznu kontrolu.

## Parametri
- `pageHeightMm`: ukupna visina stranice u mm (default 297)
- `headerHeightMm`: visina hedera u mm (default 40)
- `footerHeightMm`: visina futera u mm (default 20)
- `minLastPageRows`: minimalan broj redova na poslednjoj strani (default 3)

## Tok algoritma

```
[Ulaz: stavke] -> [procena visine reda] -> [akumulacija visine]
  -> [prekoračenje kapaciteta?] --da--> [završi stranu] -> [nastavi]
                           --ne--> [dodaj red] -> [nastavi]

[balansiranje poslednje strane] -> [indeksi po stranama] -> [stranice]
```

## Granični uslovi
- Prekid se vrši između redova (nema podele unutar reda).
- Heder i futer se prikazuju na svakoj strani.
- Ako je poslednja strana suviše kratka, jedan red se pomera sa prethodne strane.

## Prilagođavanje
- Povećajte `headerHeightMm`/`footerHeightMm` ako heder/futer sadrže više elemenata.
- Podesite procenu dužine reda preko broja znakova po liniji u funkciji procene visine.

