import { exec } from 'child_process';
import path from 'path';
import fs from 'fs';

import { unpack } from "kindleunpack";
import translate from '@iamtraction/google-translate';

(async () => {
	const translatedText = [];
	await unpack("book.mobi", "output/");
	const dirPath = './output/mobi7';
	const filePath = 'book.html';
	const fullPath = path.join(dirPath, filePath);
	let fileData = fs.readFileSync(fullPath, 'utf-8');
	
	let tempText = {
		isTextWriting: false,
		textBeginId: null,
		textEndId: null,
	};
	
	let i = 0;
	while (fileData[i] !== undefined) {
		if (fileData[i] === '>' && fileData[i+1] !== '<' && !tempText.isTextWriting) {
			tempText.isTextWriting = true;
			tempText.textBeginId = i+1;
		};
		if (fileData[i] !== '>' && fileData[i+1] === '<' && tempText.isTextWriting) {
			tempText.isTextWriting = false;
			tempText.textEndId = i+1;
		};
	
		if (!tempText.isTextWriting && tempText.textBeginId !== null && tempText.textEndId !== null) {
			const substring = fileData.slice(tempText.textBeginId, tempText.textEndId);
			await translate(substring, { from: 'en', to: 'ru' }).then(res => {
				translatedText.unshift({textBeginId: tempText.textBeginId, textEndId: tempText.textEndId, text: res.text});
			}).catch(err => {
				console.error(err);
			});
			tempText.isTextWriting = false;
			tempText.textBeginId = null;
			tempText.textEndId = null;
		}
		console.clear();
		console.log(`${((i * 100 ) / fileData.length).toFixed(2)}%` );
		i++;
	};
	
	translatedText.forEach(item => {
		fileData = fileData.slice(0, item.textBeginId) + item.text + fileData.slice(item.textEndId);
	});
	
	console.clear();
	
	fs.writeFileSync('./output/mobi7/book.html', fileData)
	
	exec('kindlegen -c2 ./output/mobi7/content.opf -o translatedBook.mobi', (err, stdout, stderr) => {
		if (err) {
		  console.error(err);
		  return;
		}
		console.log(stdout);
	  });
})();