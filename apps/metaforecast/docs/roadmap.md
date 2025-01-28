Metaforecast: Roadmap
=====================

Note: Applies to both frontend and backend. Pull requests welcome.

# Stabilization

## Stabilize the api.
Importance: 5/5

Right now, the api is hosted in an ubuntu server, together with other services. Move it to it's own separate server, something like api.metaforecast.org, and document it. 

## Better documentation
Importance: 5/5

Right now, neither the API nor some of the functionality is that well documented. 

## Unify forecasting services
Importance: ?/5

Right now, I'm using various services to host various parts of metaforecast:
- Heroku 1: To host the service which updates the forecasts once a day
- Heroku 2: Host the metaforecast twitter bot
- Digital Ocean 1: Host the database
- Mongo: Host the legacy database
- Digital Ocean 2: Host the api server

This could all be simplified. But this would require making an executive decision as to whether to go for scalability and greater expense, or to go for a cheaper but less scalable digitalocean server

I think that a simplication would be to:

1. Use one server for both external API and fetching probabilities each day
2. Use a separate Heroku server for the twitter bot.

If I was doing this on my own, I would deploy 1. into a Njal.la server using Alpine Linux. However, more convenient options would be:

- A Digital Ocean droplet using Ubuntu/Debian
- A Heroku instance.

The biggest difference between Digital Ocean and Heroku is that I'm using [pm2](https://pm2.keymetrics.io/) on Digital Ocean, whereas Heroku has its own load balancer, logs, etc.

## General code review
Importance: 3/5, but good first issue. Would also allow you to incorporate 

## Take over updating for INFER and Good Judgment Open
Right now, INFER and Good Judgment Open require me spending 1 min/week to update the predictions, but I find it inordinately annoying. This isn't automated, because I need to get the cookies manually. Automating this or taking over this would easily be worth $50/month to me.

## Fix analytics
Importance: 3/5

After some build changes, our analytics (plausible.io) are not really working. Figure out how to fix this.

# Improvements

## Tools for forecasters
Importance: 3/5 for each tool, but 5/5 overall

Create reminders, or alerts for question movements that people can sign up to. Create ways to more efficiently update predictions, or include google news predictions automatically. Create a way for forecasters to draw their own predictions.

## Display forecast history
Importance: 5/5. 
Create graphs 

This might involve creating a page for each prediction.

## Allow users to save and star predictions
Importance: 2/5

Would be nice, but would be better do do some maintenance first.

## Bring [predict, resolve and tally](https://github.com/NunoSempere/PredictResolveTally) functionality to metaforecast
Importance: 3/5

Improve the metaforecast twitter bot

## Get news media to use more forecasting
Importance: 3/5, bad fit

## Extract consensus forecast from similar questions.
Would require some thinking

## Collaborate with Clay Graubard
He's been doing some high-quality quantitative journalism around Ukraine. Tools and improvements that he would find valuable are probably a good idea, particularly if they are reusable.

## Improve dashboards
Importance: 3/5

Right now, dashboards exist in rudimentary form, but they could use some improvement. A particular request was to allow the embeddable dashboards to show/not show the title and description. The description could also be written in markdown but rendered into html. The hash which represents it should probably be of the whole thing (title, description, etc.), not just of the items. Dashboards could also be made searchable.

## Add additional tooling / things you would find cool
I'm very up for paying for 20% of your time to work on features of your choice, or which you find particularly motivating to work on. You could also brainstorm stuff which would seem to be particularly valuable.

