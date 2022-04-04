
gf:	
	npm install
	git add .
	git commit -m "fast commit"
	git push
	docker exec -it 92c5c4e94afe npm remove nstankov-bg/node-red-contrib-random-output-advanced
	docker exec -it 92c5c4e94afe npm install nstankov-bg/node-red-contrib-random-output-advanced
	docker restart 92c5c4e94afe

ni:
	docker exec -it 92c5c4e94afe npm install nstankov-bg/node-red-contrib-random-output-advanced
	docker restart 92c5c4e94afe

nu: 
	docker exec -it 92c5c4e94afe npm remove nstankov-bg/node-red-contrib-random-output-advanced
	docker exec -it 92c5c4e94afe npm install nstankov-bg/node-red-contrib-random-output-advanced
	docker restart 92c5c4e94afe
re:
	docker restart 92c5c4e94afe

ex:
	docker exec -it 92c5c4e94afe sh