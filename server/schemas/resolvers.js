const { AuthenticationError } = require('apollo-server-express');
const { User, Thought, Game } = require('../models');
const { signToken } = require('../utils/auth');

const resolvers = {
  Query: {
    me: async (parent, args, context) => {
      if (context.user) {
        const userData = await User.findOne({ _id: context.user._id })
          .select('-__v -password')
          .populate('thoughts')
          .populate('friends')
          .populate('games');

        return userData;
      }

      throw new AuthenticationError('Not logged in');
    },
    users: async () => {
      return User.find()
        .select('-__v -password')
        .populate('thoughts')
        .populate('friends')
        .populate('games');
    },
    user: async (parent, { username }) => {
      return User.findOne({ username })
        .select('-__v -password')
        .populate('friends')
        .populate('thoughts')
        .populate('games');
    },
    thoughts: async (parent, { username }) => {
      const params = username ? { username } : {};
      return Thought.find(params).sort({ createdAt: -1 });
    },
    thought: async (parent, { _id }) => {
      return Thought.findOne({ _id });
    },
    games: async (parent, { username }) => {
      const params = username ? { username } : {};
      return Game.find(params).sort({ createdAt: -1 });
    },
    game: async (parent, { _id }) => {
      return Game.findOne({ _id });
    }
  },

  Mutation: {
    addUser: async (parent, args) => {
      const user = await User.create(args);
      const token = signToken(user);

      return { token, user };
    },
    updateUserSteam: async (parent, args, context) => {
      console.log(context.user);
      const user = await User.findOneAndUpdate({ _id: context.user._id }, {steamUser: args.steamUser})
      const token = signToken(user);
      return user;
    },
    login: async (parent, { email, password }) => {
      const user = await User.findOne({ email });

      if (!user) {
        throw new AuthenticationError('Incorrect credentials');
      }

      const correctPw = await user.isCorrectPassword(password);

      if (!correctPw) {
        throw new AuthenticationError('Incorrect credentials');
      }

      const token = signToken(user);
      return { token, user };
    },
    addGame: async (parent, args, context) => {
      if (context.user) {
        const game = await Game.create({ ...args, username: context.user.username });

        await User.findByIdAndUpdate(
          { _id: context.user._id },
          { $push: { games: game._id } },
          { new: true }
        );

        return game;
      }

      throw new AuthenticationError('You need to be logged in!');
    },
    removeGame: async (parent, args, context) => {
      if (context.user) {
        // console.log(context.user);
        //console.log(args);
        await User.findByIdAndUpdate(
          { _id: context.user._id },
          { $pull: { games: args.gameid } },
          { new: true }
        );
        return Game.findByIdAndRemove({ _id: args.gameid })
        return "deleted";
      }
      throw new AuthenticationError('You need to be logged in!');
    },
    addThought: async (parent, args, context) => {
      if (context.user) {
        const thought = await Thought.create({ ...args, username: context.user.username });

        await User.findByIdAndUpdate(
          { _id: context.user._id },
          { $push: { thoughts: thought._id } },
          { new: true }
        );

        return thought;
      }

      throw new AuthenticationError('You need to be logged in!');
    },
    addReaction: async (parent, { thoughtId, reactionBody }, context) => {
      if (context.user) {
        const updatedThought = await Thought.findOneAndUpdate(
          { _id: thoughtId },
          { $push: { reactions: { reactionBody, username: context.user.username } } },
          { new: true, runValidators: true }
        );

        return updatedThought;
      }

      throw new AuthenticationError('You need to be logged in!');
    },
    addFriend: async (parent, { friendId }, context) => {
      if (context.user) {
        const updatedUser = await User.findOneAndUpdate(
          { _id: context.user._id },
          { $addToSet: { friends: friendId } },
          { new: true }
        ).populate('friends');

        return updatedUser;
      }

      throw new AuthenticationError('You need to be logged in!');
    }
  }
};

module.exports = resolvers;
