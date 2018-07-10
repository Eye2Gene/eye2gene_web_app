# The web front-end to Eye2Gene

Eye2Gene is a proof of concept of a research tool which uses deep-learning to provide a genetic diagnosis of an inherited rare retinal disease based on autofluorescent retinal imaging.

The deep-learning backend currently uses a retrained version of Inception implemented in tensorflow.
The training has occured on X images classified in the following categories.

## Installation

Feel free to give us a shout on the github issues, if you would like more help than that below.

### Installation Requirements

* Ruby (>= 2.2.0)
  * Recommended to use [rvm](https://rvm.io/rvm/install) to install ruby

### App Installation

```bash
# After cloning the web app and moving into the source directory
# Install bundler
gem install bundler

# Use bundler to install dependencies
bundle install

# Alternatively run eye2gene using Phusion Passenger
# Mainly for production
bundle exec passenger start -h
```

## Launch eye2gene

To configure and launch eye2gene, run the following from a command line from the eye2gene root folder.

```bash
bundle exec passenger start -h
```

### Development Mode

Start Eye2Gene with `bundle exec` - which executes eye2gene in the context of the bundle - i.e so you don't need to keep reinstalling

```
# Run eye2gene
bundle exec eye2gene -D
```

To re-compile the assets, run:

```sh
bundle exec rake assets
```


That's it! Open [http://localhost:3000/](http://localhost:3000/) and start using eye2gene!

## Advanced Usage

See `$ passenger start -h` for more information on all the options available when running eye2gene.

## Config file

A Config file can be used to specify arguments - the default location of this file is in the home directory at `~/.eye2gene.conf`. An examplar of the config file can be seen below.

```yaml
---
:num_threads: 8
:port: 3000
:host: 0.0.0.0
:eye2gene_dir: "/Users/ismailm/.eye2gene"
:ssl: false
```

A config file can be generated using the `-s` argument. The above exemplar config file was generated as follows:

```bash
eye2gene -s -n 8
```
