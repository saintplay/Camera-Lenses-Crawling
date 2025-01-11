# Lens Crawling

This project compiles into a google chrome extension which can be used to get information about lenses (Aperture, Focal length, available mounts, price, etc).

Google Gemini API is also used to retrieve text from images (e.g. Some meike lenses have their characteristic in an image instead of text). The request to Gemini API is going to get cached locally using image SHA, so no unnecessaries queries are made.

This is meant to be used with your own lens db table (google sheet, excel or anything in csv format)

# Supported pages

- <https://www.amazon.com/>
- <https://www.bhphotovideo.com/>
- <https://www.fujifilm-x.com/>
- <https://www.meikeglobal.com/>

Adding more pages is very easy, as this project provides an internal api to crawl for elements, and getting lens information has very similar logic across all pages.
