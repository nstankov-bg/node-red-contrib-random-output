
gf:	
	npm install
	git add .
	git commit -m "fast commit"
	git push
	docker-compose exec -it churchlight npm remove nstankov-bg/node-red-contrib-random-output-advanced
	docker-compose exec -it churchlight npm install nstankov-bg/node-red-contrib-random-output-advanced
	docker-compose restart churchlight

ni:
	docker-compose exec -it churchlight npm install nstankov-bg/node-red-contrib-random-output-advanced
	docker-compose restart churchlight

nu: 
	docker-compose exec -it churchlight npm remove nstankov-bg/node-red-contrib-random-output-advanced
	docker-compose exec -it churchlight npm install nstankov-bg/node-red-contrib-random-output-advanced
	docker-compose restart churchlight
re:
	docker-compose restart churchlight

ex:
	docker-compose exec -it churchlight sh

up:
	docker-compose up -d
down:
	docker-compose down