# Start both Express (POS) and Next.js (Loyalty) servers
# Express runs on $PORT (Heroku's assigned port)
# Next.js runs on port 3001 and needs to know where Express is
web: BACKEND_INTERNAL_URL=http://localhost:$PORT npm run start:production