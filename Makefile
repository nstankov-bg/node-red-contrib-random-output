
gf:	
	npm install
	git add .
	git commit -m "fast commit"
	git push

ni:
	docker exec -it 92c5c4e94afe npm install nstankov-bg/node-red-contrib-random-output-advanced@0.1.12
	docker restart 92c5c4e94afe
nu: 

	docker exec -it 92c5c4e94afe npm update nstankov-bg/node-red-contrib-random-output-advanced@0.1.12
	docker restart 92c5c4e94afe
ex:
	docker exec -it 92c5c4e94afe sh